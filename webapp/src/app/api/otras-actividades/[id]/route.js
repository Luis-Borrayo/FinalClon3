export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

const includeInscripciones = { inscripciones: { select: { email: true, user_id: true } } };

function toFrontend(a) {
  const inscritos = (a.inscripciones ?? []).map(i => i.email);
  return {
    id: a.codigo,
    _dbId: a.id,
    nombre: a.nombre,
    tipo: a.tipo,
    ubicacion: a.ubicacion,
    mapaUrl: a.mapa_url,
    meetUrl: a.meet_url,
    modalidad: a.modalidad,
    costo: a.costo,
    monto: String(a.monto),
    fecha: a.fecha,
    horaInicio: a.hora_inicio,
    horaFin: a.hora_fin,
    participantes: a.participantes,
    asistentesConfirmados: a.asistentes_confirmados,
    inscritos,
    creador: a.creador,
    aprobador: a.aprobador,
    estado: a.estado,
    certificados: a.certificados,
    emiteCertificado: a.emite_certificado,
    descripcion: a.descripcion,
    observacionAprobacion: a.observacion_aprobacion,
  };
}

export async function PATCH(request, { params }) {
  try {
    const codigo = params.id;
    const dto = await request.json();

    const existing = await prisma.actividad.findUnique({
      where: { codigo },
      include: includeInscripciones,
    });
    if (!existing) return res.notFound('Actividad no encontrada');

    // Inscribirse en evento
    if (dto.accion === 'inscribir') {
      const { email, user_id } = dto;
      if (!email || !user_id) return res.error('Email y user_id requeridos para inscripcion');

      if (existing.participantes > 0 && existing.asistentes_confirmados >= existing.participantes) {
        return res.error('No hay cupo disponible para este evento');
      }

      // upsert — si ya existe, no lanza error
      try {
        await prisma.inscripcionActividad.create({
          data: { actividad_id: existing.id, user_id, email },
        });
      } catch (e) {
        if (e.code === 'P2002') return res.error('Ya estabas inscrito en este evento');
        throw e;
      }

      const updated = await prisma.actividad.update({
        where: { codigo },
        data: { asistentes_confirmados: existing.asistentes_confirmados + 1 },
        include: includeInscripciones,
      });
      return res.ok(toFrontend(updated), 'Inscripcion confirmada');
    }

    // Aprobar o rechazar
    if (dto.accion === 'resolver') {
      const nuevoEstado = dto.estado;
      const certificados =
        nuevoEstado === 'Aprobada'
          ? existing.emite_certificado ? 'Listo para emitir' : 'No aplica'
          : 'No aplica';

      const updated = await prisma.actividad.update({
        where: { codigo },
        data: { estado: nuevoEstado, aprobador: dto.aprobador || 'Admin', certificados, observacion_aprobacion: dto.observacion || '' },
        include: includeInscripciones,
      });
      return res.ok(toFrontend(updated));
    }

    // Enviar borrador a revisión
    if (dto.accion === 'enviar_revision') {
      if (existing.estado !== 'Borrador') return res.error('Solo se pueden enviar a revision actividades en estado borrador');

      const updated = await prisma.actividad.update({
        where: { codigo },
        data: {
          estado: 'Pendiente',
          aprobador: 'Pendiente',
          observacion_aprobacion: '',
          certificados: existing.emite_certificado
            ? existing.certificados === 'Plantilla cargada' ? 'Plantilla cargada' : 'Pendiente plantilla'
            : 'No aplica',
        },
        include: includeInscripciones,
      });
      return res.ok(toFrontend(updated));
    }

    // Editar actividad (solo borradores)
    if (dto.accion === 'editar') {
      if (existing.estado !== 'Borrador') return res.error('Solo se pueden editar actividades en estado borrador');

      const updated = await prisma.actividad.update({
        where: { codigo },
        data: {
          nombre: dto.nombre?.trim() || existing.nombre,
          tipo: dto.tipo || existing.tipo,
          modalidad: dto.modalidad || existing.modalidad,
          ubicacion: dto.ubicacion ?? existing.ubicacion,
          mapa_url: dto.mapaUrl ?? existing.mapa_url,
          meet_url: dto.meetUrl ?? existing.meet_url,
          costo: dto.costo || existing.costo,
          monto: dto.costo === 'Pago' ? parseFloat(dto.monto || '0') : 0,
          fecha: dto.fecha || existing.fecha,
          hora_inicio: dto.horaInicio || existing.hora_inicio,
          hora_fin: dto.horaFin || existing.hora_fin,
          participantes: parseInt(dto.participantes) || existing.participantes,
          emite_certificado: dto.emiteCertificado !== undefined ? Boolean(dto.emiteCertificado) : existing.emite_certificado,
          descripcion: dto.descripcion?.trim() ?? existing.descripcion,
          certificados: dto.certificados || existing.certificados,
          estado: dto.estado || existing.estado,
          aprobador: dto.estado === 'Pendiente' ? 'Pendiente' : existing.aprobador,
        },
        include: includeInscripciones,
      });
      return res.ok(toFrontend(updated));
    }

    return res.error('Accion no reconocida');
  } catch (e) {
    return res.error('Error al actualizar actividad: ' + e.message, 500);
  }
}
