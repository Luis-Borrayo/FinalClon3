/**
 * GET /api/solvencia/[carnet]
 *
 * Endpoint público (sin auth) para que cualquier módulo consulte
 * la solvencia integral de un alumno.
 *
 * Verifica:
 *  - parqueo   → cuota al día, sin sesiones sin pagar
 *  - (extensible a biblioteca, pagos-alumnos, etc.)
 *
 * Respuesta:
 * {
 *   carnet,
 *   solvente: boolean,          // true solo si TODOS los módulos están al día
 *   modulos: {
 *     parqueo: { al_dia, deuda_pendiente, detalle }
 *   }
 * }
 */
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(_req, { params }) {
  try {
    const { carnet } = await params;

    // ── Buscar usuario en parqueo por carnet ───────────────────────
    const user = await prisma.user.findFirst({
      where: { carnet, deleted_at: null },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        carnet: true,
      },
    });

    if (!user) {
      return res.ok({
        carnet,
        solvente: false,
        modulos: {
          parqueo: {
            al_dia: false,
            detalle: 'Carnet no registrado en el sistema de parqueo',
            deuda_pendiente: 0,
          },
        },
      });
    }

    const now = new Date();

    // ── Parqueo: suscripción activa + sesiones sin pagar ───────────
    const [suscripcion, sesionesSinPagar] = await Promise.all([
      prisma.parkingSubscription.findFirst({
        where: { user_id: user.id, status: 'ACTIVE', end_date: { gt: now } },
        select: { type: true, end_date: true },
      }),
      prisma.parkingSession.findMany({
        where: { user_id: user.id, is_paid: false, status: 'COMPLETED' },
        select: { amount_due: true },
      }),
    ]);

    const deuda_parqueo = sesionesSinPagar.reduce((s, x) => s + (x.amount_due ?? 0), 0);
    const parqueo_al_dia = deuda_parqueo === 0;

    // ── Resultado final ────────────────────────────────────────────
    const solvente = parqueo_al_dia; // ampliar cuando otros módulos exporten su estado

    return res.ok({
      carnet,
      usuario: {
        nombre: `${user.first_name} ${user.last_name}`.trim(),
        rol: user.role,
      },
      solvente,
      modulos: {
        parqueo: {
          al_dia: parqueo_al_dia,
          deuda_pendiente: parseFloat(deuda_parqueo.toFixed(2)),
          tiene_suscripcion_activa: !!suscripcion,
          suscripcion: suscripcion
            ? {
                tipo: suscripcion.type,
                vence: suscripcion.end_date.toISOString(),
                dias_restantes: Math.max(
                  0,
                  Math.ceil((suscripcion.end_date - now) / 86_400_000)
                ),
              }
            : null,
          detalle: parqueo_al_dia
            ? 'Sin deudas de parqueo'
            : `Deuda pendiente: Q${deuda_parqueo.toFixed(2)}`,
        },
      },
    });
  } catch (e) {
    return res.error(e.message);
  }
}
