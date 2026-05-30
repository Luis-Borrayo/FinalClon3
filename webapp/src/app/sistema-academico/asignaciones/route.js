export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';




export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const alumnoId = searchParams.get("alumnoId");
    const ciclo = searchParams.get("ciclo");

    const where = {};
    if (alumnoId) where.alumnoId = parseInt(alumnoId);
    if (ciclo) where.ciclo = ciclo;

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
  try {
    const body = await request.json();
    const { alumnoId, cursoId, ciclo } = body;

    // Validaciones
    if (!alumnoId || !cursoId || !ciclo) {
      return Response.json({ success: false, error: "Todos los campos son requeridos: alumnoId, cursoId, ciclo" }, { status: 400 });
    }

    // Verificar que el alumno existe
    const alumno = await prisma.alumno.findUnique({ where: { id: parseInt(alumnoId) } });
    if (!alumno) {
      return Response.json({ success: false, error: "El alumno no existe" }, { status: 404 });
    }

    // Verificar que el curso existe
    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) {
      return Response.json({ success: false, error: "El curso no existe" }, { status: 404 });
    }

    // Verificar que no esté ya asignado al mismo curso en el mismo ciclo
    const asignacionExiste = await prisma.asignacion.findUnique({
      where: { alumnoId_cursoId_ciclo: { alumnoId: parseInt(alumnoId), cursoId: parseInt(cursoId), ciclo } },
    });
    if (asignacionExiste) {
      return Response.json({ success: false, error: `El alumno ya está asignado a ${curso.nombre} en el ciclo ${ciclo}` }, { status: 409 });
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