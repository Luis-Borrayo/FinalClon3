import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

async function getTariff(role) {
  try {
    const t = await prisma.tariffConfig.findUnique({ where: { role } });
    if (t) return { hourly_rate: parseFloat(t.hourly_rate), is_free: t.is_free, max_free_hours: t.max_free_hours };
  } catch {}
  const fallback = { ADMIN: 0, TEACHER: 0, STUDENT: 5, VISITOR: 10, SECURITY: 0 };
  const rate = fallback[role] ?? 5;
  return { hourly_rate: rate, is_free: rate === 0, max_free_hours: role === 'TEACHER' ? 8 : null };
}

async function calcAmount(role, duration_minutes) {
  const tariff = await getTariff(role);
  if (tariff.is_free) {
    if (tariff.max_free_hours && duration_minutes > tariff.max_free_hours * 60) {
      const excedente = duration_minutes - tariff.max_free_hours * 60;
      const studentTariff = await getTariff('STUDENT');
      return parseFloat(((excedente / 60) * studentTariff.hourly_rate).toFixed(2));
    }
    return 0;
  }
  return parseFloat(((duration_minutes / 60) * tariff.hourly_rate).toFixed(2));
}

async function getActiveEvent() {
  const now = new Date();
  return prisma.parkingEvent.findFirst({
    where: { status: { in: ['ACTIVE', 'SCHEDULED'] }, start_time: { lte: now }, end_time: { gte: now } },
  }).catch(() => null);
}

async function getActiveSub(user_id) {
  if (!user_id) return null;
  return prisma.parkingSubscription.findFirst({
    where: { user_id, status: 'ACTIVE', end_date: { gt: new Date() } },
  }).catch(() => null);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const code = body.code ?? body.qr_code;
    if (!code) return res.error('Código requerido');

    // ── Buscar usuario por QR ─────────────────────────────────────────────
    const user = await prisma.user.findFirst({
      where: { qr_code: code, deleted_at: null, is_active: true },
      include: {
        vehicles: {
          where: { deleted_at: null, is_authorized: true, blacklisted: false },
          include: { sessions: { where: { status: 'ACTIVE' }, take: 1, include: { space: true } } },
        },
      },
    });

    if (user) {
      const vehicle = user.vehicles[0] ?? null;
      const activeSession = vehicle?.sessions?.[0] ?? null;

      // ── SALIDA ────────────────────────────────────────────────────────────
      if (activeSession) {
        const exit_time = new Date();
        const duration_minutes = Math.ceil((exit_time - new Date(activeSession.entry_time)) / 60000);

        const [activeEvent, activeSub] = await Promise.all([
          getActiveEvent(),
          getActiveSub(user.id),
        ]);

        let amount_due;
        let is_paid = false;

        if (activeSub) {
          amount_due = 0;
          is_paid = true;
        } else if (activeEvent?.tariff_mode === 'FLAT_RATE') {
          amount_due = parseFloat(activeEvent.flat_rate);
        } else {
          amount_due = await calcAmount(user.role, duration_minutes);
          if (amount_due === 0) is_paid = true;
        }

        // Si hay pago pendiente, solo guardamos los datos calculados en la sesión
        // pero la dejamos ACTIVE. El payments route la completará al confirmar el pago.
        if (!is_paid) {
          await prisma.parkingSession.update({
            where: { id: activeSession.id },
            data: { exit_time, duration_minutes, amount_due, is_paid: false },
          });
        } else {
          await prisma.$transaction([
            prisma.parkingSession.update({
              where: { id: activeSession.id },
              data: { status: 'COMPLETED', exit_time, duration_minutes, amount_due, is_paid },
            }),
            prisma.parkingSpace.update({
              where: { id: activeSession.space_id },
              data: { status: 'AVAILABLE' },
            }),
          ]);
        }

        return res.ok({
          action: 'EXIT',
          session_id: activeSession.id,
          placa: vehicle.placa,
          owner_name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          space_code: activeSession.space?.code,
          zone: activeSession.space?.zone,
          duration_minutes,
          amount_due,
          is_paid,
          evento: activeEvent?.name ?? null,
          suscripcion: !!activeSub,
        });
      }

      // ── ENTRADA ───────────────────────────────────────────────────────────
      if (!vehicle) return res.error('El usuario no tiene vehículos autorizados');

      const now = new Date();
      // Verificar si el usuario tiene una reserva activa en la ventana de tiempo
      const activeReservation = await prisma.reservation.findFirst({
        where: {
          user_id: user.id,
          status: 'CONFIRMED',
          start_time: { lte: new Date(now.getTime() + 30 * 60 * 1000) }, // hasta 30 min adelante
          end_time: { gt: now },
        },
        include: { space: true },
        orderBy: { start_time: 'asc' },
      });

      let space;
      let usedReservation = null;

      if (activeReservation && activeReservation.space?.status !== 'OCCUPIED') {
        // Usar el espacio reservado
        space = activeReservation.space;
        usedReservation = activeReservation;
      } else {
        // Sin reserva válida: asignar primer espacio disponible
        space = await prisma.parkingSpace.findFirst({
          where: { status: 'AVAILABLE', is_active: true },
          orderBy: [{ zone: 'asc' }, { code: 'asc' }],
        });
      }

      if (!space) return res.error('No hay espacios disponibles');

      const [activeEvent, activeSub] = await Promise.all([
        getActiveEvent(),
        getActiveSub(user.id),
      ]);

      const sessionData = {
        vehicle_id: vehicle.id,
        space_id: space.id,
        user_id: user.id,
        entry_method: 'QR',
        status: 'ACTIVE',
        entry_time: now,
        notes: usedReservation
          ? `Reserva: ${usedReservation.id}${activeEvent ? ` | Evento: ${activeEvent.name}` : ''}`
          : (activeEvent ? `Evento: ${activeEvent.name}` : null),
      };

      if (activeSub) {
        sessionData.amount_due = 0;
        sessionData.is_paid = true;
      } else if (activeEvent?.tariff_mode === 'FLAT_RATE') {
        sessionData.amount_due = parseFloat(activeEvent.flat_rate);
      }

      const txOps = [
        prisma.parkingSession.create({ data: sessionData }),
        prisma.parkingSpace.update({ where: { id: space.id }, data: { status: 'OCCUPIED' } }),
      ];

      if (usedReservation) {
        txOps.push(
          prisma.reservation.update({
            where: { id: usedReservation.id },
            data: { status: 'USED' },
          })
        );
      }

      const [session] = await prisma.$transaction(txOps);

      return res.ok({
        action: 'ENTRY',
        placa: vehicle.placa,
        owner_name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        space_code: space.code,
        zone: space.zone,
        entry_time: session.entry_time,
        evento: activeEvent?.name ?? null,
        suscripcion: !!activeSub,
        reserva: usedReservation ? { id: usedReservation.id, type: usedReservation.type } : null,
      });
    }

    // ── Buscar QR de visitante (entrada o salida) ────────────────────────
    const visitorQr = await prisma.visitorQR.findFirst({
      where: { qr_code: code },
    });

    // Segunda pasada: visitante ya ingresó → registrar salida
    if (visitorQr?.is_used) {
      // Buscar sesión activa por session_id o por placa del vehículo (fallback)
      const activeSession = await prisma.parkingSession.findFirst({
        where: {
          status: 'ACTIVE',
          ...(visitorQr.session_id
            ? { id: visitorQr.session_id }
            : { vehicle: { placa: visitorQr.vehicle_plate } }),
        },
        include: { space: true },
      });
      if (activeSession) {
        const exit_time = new Date();
        const duration_minutes = Math.ceil((exit_time - new Date(activeSession.entry_time)) / 60000);
        const amount_due = await calcAmount('VISITOR', duration_minutes);
        const is_paid = amount_due === 0;
        if (!is_paid) {
          await prisma.parkingSession.update({
            where: { id: activeSession.id },
            data: { exit_time, duration_minutes, amount_due, is_paid: false },
          });
        } else {
          await prisma.$transaction([
            prisma.parkingSession.update({
              where: { id: activeSession.id },
              data: { status: 'COMPLETED', exit_time, duration_minutes, amount_due, is_paid },
            }),
            prisma.parkingSpace.update({ where: { id: activeSession.space_id }, data: { status: 'AVAILABLE' } }),
          ]);
        }
        return res.ok({
          action: 'EXIT',
          session_id: activeSession.id,
          placa: visitorQr.vehicle_plate,
          owner_name: visitorQr.visitor_name,
          role: 'VISITOR',
          space_code: activeSession.space?.code,
          zone: activeSession.space?.zone,
          duration_minutes,
          amount_due,
          is_paid,
        });
      }
    }

    if (visitorQr && !visitorQr.is_used && visitorQr.expires_at > new Date()) {
      const space = await prisma.parkingSpace.findFirst({
        where: { status: 'AVAILABLE', is_active: true },
        orderBy: [{ zone: 'asc' }, { code: 'asc' }],
      });
      if (!space) return res.error('No hay espacios disponibles');

      // Buscar o crear vehículo temporal para el visitante
      let vehicle = await prisma.vehicle.findFirst({
        where: { placa: visitorQr.vehicle_plate, deleted_at: null },
      });
      if (!vehicle) {
        // Crear usuario VISITOR con el nombre del visitante para que aparezca correctamente
        const nameParts = visitorQr.visitor_name.trim().split(' ');
        const firstName = nameParts[0] ?? 'Visitante';
        const lastName  = nameParts.slice(1).join(' ') || ' ';
        const email     = `visitor-${visitorQr.id}@parqueo.uspg.local`;

        const visitorUser = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            password_hash: 'VISITOR_NO_LOGIN',
            role: 'VISITOR',
            first_name: firstName,
            last_name: lastName,
            qr_code: `VIS-USER-${visitorQr.id}`,
            is_active: false,
          },
        });

        let carDetails = {};
        try { carDetails = JSON.parse(visitorQr.purpose ?? '{}'); } catch {}

        vehicle = await prisma.vehicle.create({
          data: {
            placa: visitorQr.vehicle_plate,
            user_id: visitorUser.id,
            is_authorized: true,
            brand: carDetails.brand ?? null,
            model: carDetails.model ?? null,
            color: carDetails.color ?? null,
          },
        });
      }

      const [session] = await prisma.$transaction([
        prisma.parkingSession.create({
          data: {
            vehicle_id: vehicle.id,
            space_id: space.id,
            entry_method: 'VISITOR_QR',
            status: 'ACTIVE',
            entry_time: new Date(),
            notes: `Visitante: ${visitorQr.visitor_name}`,
          },
        }),
        prisma.parkingSpace.update({ where: { id: space.id }, data: { status: 'OCCUPIED' } }),
        prisma.visitorQR.update({
          where: { id: visitorQr.id },
          data: { is_used: true, used_at: new Date() },
        }),
      ]);

      // Vincular sesión al QR de visitante
      await prisma.visitorQR.update({
        where: { id: visitorQr.id },
        data: { session_id: session.id },
      });

      return res.ok({
        action: 'ENTRY',
        placa: visitorQr.vehicle_plate,
        owner_name: visitorQr.visitor_name,
        role: 'VISITOR',
        space_code: space.code,
        zone: space.zone,
        entry_time: session.entry_time,
        vehicle_type: 'VISITOR',
        proposito: visitorQr.purpose,
      });
    }

    return res.error('QR inválido o expirado', 403);
  } catch (e) {
    return res.error(e.message);
  }
}
