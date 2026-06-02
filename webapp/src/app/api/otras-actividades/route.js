export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma-otras';
import * as res from '@/lib/response';

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

const includeInscripciones = { inscripciones: { select: { email: true, user_id: true } } };

export async function GET() {
  try {
    const actividades = await prisma.actividad.findMany({
      orderBy: { created_at: 'desc' },
      include: includeInscripciones,
    });
    return res.ok(actividades.map(toFrontend));
  } catch (e) {
    return res.error('Error al obtener actividades: ' + e.message, 500);
  }
}

export async function POST(request) {
  try {
    const dto = await request.json();
    if (!dto.nombre?.trim() || !dto.fecha || !dto.horaInicio) {
      return res.error('Faltan campos requeridos: nombre, fecha, horaInicio');
    }

    const total = await prisma.actividad.count();
    const codigo = `ACT-2026-${String(total + 1).padStart(3, '0')}`;

    const actividad = await prisma.actividad.create({
      data: {
        codigo,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo || 'Deportiva',
        modalidad: dto.modalidad || 'Presencial',
        ubicacion: dto.ubicacion || '',
        mapa_url: dto.mapaUrl || '',
        meet_url: dto.meetUrl || '',
        costo: dto.costo || 'Gratuita',
        monto: dto.costo === 'Pago' ? parseFloat(dto.monto || '0') : 0,
        fecha: dto.fecha,
        hora_inicio: dto.horaInicio || '',
        hora_fin: dto.horaFin || '',
        participantes: parseInt(dto.participantes) || 0,
        asistentes_confirmados: 0,
        creador: dto.creador || '',
        aprobador: dto.estado === 'Pendiente' ? 'Pendiente' : 'Sin enviar',
        estado: dto.estado || 'Borrador',
        certificados: dto.certificados || 'No aplica',
        emite_certificado: Boolean(dto.emiteCertificado),
        descripcion: dto.descripcion?.trim() || '',
        observacion_aprobacion: '',
      },
      include: includeInscripciones,
    });

    return res.created(toFrontend(actividad), 'Actividad creada');
  } catch (e) {
    return res.error('Error al crear actividad: ' + e.message, 500);
  }
}
