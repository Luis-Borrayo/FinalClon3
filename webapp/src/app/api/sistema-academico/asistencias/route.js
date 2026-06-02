import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER');
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const alumnoId  = searchParams.get("alumnoId");
    const horarioId = searchParams.get("horarioId");

    const where = {};
    if (alumnoId)  where.alumnoId  = parseInt(alumnoId);
    if (horarioId) where.horarioId = parseInt(horarioId);

    const asistencias = await prisma.asistencia.findMany({
      where,
      include: {
        alumno: true,
        horario: { include: { curso: true, catedratico: true } },
      },
      orderBy: { fecha: "desc" },
    });
    return Response.json({ success: true, data: asistencias });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER');
  if (error) return error;

  try {
    const body = await request.json();
    const { alumnoId, horarioId, fecha, presente } = body;

    if (!alumnoId || !horarioId || !fecha) {
      return Response.json(
        { success: false, error: "Todos los campos son requeridos: alumnoId, horarioId, fecha" },
        { status: 400 }
      );
    }

    const alumno = await prisma.alumno.findUnique({ where: { id: parseInt(alumnoId) } });
    if (!alumno) return Response.json({ success: false, error: "El alumno no existe" }, { status: 404 });

    const horario = await prisma.horario.findUnique({
      where: { id: parseInt(horarioId) },
      include: { curso: true },
    });
    if (!horario) return Response.json({ success: false, error: "El horario no existe" }, { status: 404 });

    const asignacion = await prisma.asignacion.findFirst({
      where: { alumnoId: parseInt(alumnoId), cursoId: horario.cursoId },
    });
    if (!asignacion) {
      return Response.json(
        { success: false, error: `El alumno no está asignado al curso ${horario.curso.nombre}` },
        { status: 409 }
      );
    }

    const existe = await prisma.asistencia.findUnique({
      where: {
        alumnoId_horarioId_fecha: {
          alumnoId:  parseInt(alumnoId),
          horarioId: parseInt(horarioId),
          fecha:     new Date(fecha),
        },
      },
    });
    if (existe) {
      return Response.json(
        { success: false, error: "Ya existe una asistencia registrada para este alumno en esta fecha y horario" },
        { status: 409 }
      );
    }

    const asistencia = await prisma.asistencia.create({
      data: {
        alumnoId:  parseInt(alumnoId),
        horarioId: parseInt(horarioId),
        fecha:     new Date(fecha),
        presente:  presente ?? true,
      },
      include: { alumno: true, horario: { include: { curso: true } } },
    });
    return Response.json({ success: true, data: asistencia }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
