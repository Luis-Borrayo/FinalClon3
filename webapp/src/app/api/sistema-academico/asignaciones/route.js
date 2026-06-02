import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT');
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const alumnoId = searchParams.get("alumnoId");
    const ciclo    = searchParams.get("ciclo");

    const where = {};
    if (alumnoId) where.alumnoId = parseInt(alumnoId);
    if (ciclo)    where.ciclo    = ciclo;

    const asignaciones = await prisma.asignacion.findMany({
      where,
      include: { alumno: true, curso: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: asignaciones });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER');
  if (error) return error;

  try {
    const body = await request.json();
    const { alumnoId, cursoId, ciclo } = body;

    if (!alumnoId || !cursoId || !ciclo) {
      return Response.json(
        { success: false, error: "Todos los campos son requeridos: alumnoId, cursoId, ciclo" },
        { status: 400 }
      );
    }

    const alumno = await prisma.alumno.findUnique({ where: { id: parseInt(alumnoId) } });
    if (!alumno) return Response.json({ success: false, error: "El alumno no existe" }, { status: 404 });

    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) return Response.json({ success: false, error: "El curso no existe" }, { status: 404 });

    const existe = await prisma.asignacion.findUnique({
      where: { alumnoId_cursoId_ciclo: { alumnoId: parseInt(alumnoId), cursoId: parseInt(cursoId), ciclo } },
    });
    if (existe) {
      return Response.json(
        { success: false, error: `El alumno ya está asignado a ${curso.nombre} en el ciclo ${ciclo}` },
        { status: 409 }
      );
    }

    const asignacion = await prisma.asignacion.create({
      data: { alumnoId: parseInt(alumnoId), cursoId: parseInt(cursoId), ciclo },
      include: { alumno: true, curso: true },
    });
    return Response.json({ success: true, data: asignacion }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
