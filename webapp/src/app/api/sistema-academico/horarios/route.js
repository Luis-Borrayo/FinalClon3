import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT');
  if (error) return error;

  try {
    const horarios = await prisma.horario.findMany({
      include: { curso: true, catedratico: true },
      orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
    });
    return Response.json({ success: true, data: horarios });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER');
  if (error) return error;

  try {
    const body = await request.json();
    const { cursoId, catedraticoId, dia, horaInicio, horaFin, salon } = body;

    if (!cursoId || !catedraticoId || !dia || !horaInicio || !horaFin || !salon) {
      return Response.json({ success: false, error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (horaInicio >= horaFin) {
      return Response.json(
        { success: false, error: "La hora de inicio debe ser menor a la hora de fin" },
        { status: 400 }
      );
    }

    const catedratico = await prisma.catedraticoAcademico.findUnique({ where: { id: parseInt(catedraticoId) } });
    if (!catedratico) return Response.json({ success: false, error: "El catedrático no existe" }, { status: 404 });

    const traslape = await prisma.horario.findFirst({
      where: {
        catedraticoId: parseInt(catedraticoId),
        dia,
        AND: [{ horaInicio: { lt: horaFin } }, { horaFin: { gt: horaInicio } }],
      },
    });
    if (traslape) {
      return Response.json(
        { success: false, error: `El catedrático ya tiene horario el ${dia} de ${traslape.horaInicio} a ${traslape.horaFin}` },
        { status: 409 }
      );
    }

    const horario = await prisma.horario.create({
      data: { cursoId: parseInt(cursoId), catedraticoId: parseInt(catedraticoId), dia, horaInicio, horaFin, salon },
      include: { curso: true, catedratico: true },
    });
    return Response.json({ success: true, data: horario }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
