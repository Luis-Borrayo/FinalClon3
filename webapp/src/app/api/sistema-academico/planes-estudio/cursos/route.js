import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT');
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const planEstudioId = searchParams.get("planEstudioId");

    if (!planEstudioId) {
      return Response.json({ success: false, error: "planEstudioId es requerido" }, { status: 400 });
    }

    const cursos = await prisma.cursoPlan.findMany({
      where: { planEstudioId: parseInt(planEstudioId) },
      include: { curso: true },
      orderBy: { semestre: "asc" },
    });
    return Response.json({ success: true, data: cursos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body = await request.json();
    const { planEstudioId, cursoId, semestre, obligatorio } = body;

    // Validaciones
    if (!planEstudioId || !cursoId || !semestre) {
      return Response.json({ success: false, error: "Todos los campos son requeridos: planEstudioId, cursoId, semestre" }, { status: 400 });
    }

    if (semestre < 1 || semestre > 12) {
      return Response.json({ success: false, error: "El semestre debe estar entre 1 y 12" }, { status: 400 });
    }

    // Verificar que el plan existe
    const plan = await prisma.planEstudio.findUnique({ where: { id: parseInt(planEstudioId) } });
    if (!plan) {
      return Response.json({ success: false, error: "El plan de estudio no existe" }, { status: 404 });
    }

    // Verificar que el curso existe
    const curso = await prisma.curso.findUnique({ where: { id: parseInt(cursoId) } });
    if (!curso) {
      return Response.json({ success: false, error: "El curso no existe" }, { status: 404 });
    }

    // Verificar que el curso no esté ya en el plan
    const cursoExiste = await prisma.cursoPlan.findUnique({
      where: { planEstudioId_cursoId: { planEstudioId: parseInt(planEstudioId), cursoId: parseInt(cursoId) } },
    });
    if (cursoExiste) {
      return Response.json({ success: false, error: `El curso ${curso.nombre} ya está en este plan de estudio` }, { status: 409 });
    }

    const cursoPlan = await prisma.cursoPlan.create({
      data: {
        planEstudioId: parseInt(planEstudioId),
        cursoId: parseInt(cursoId),
        semestre: parseInt(semestre),
        obligatorio: obligatorio ?? true,
      },
      include: { curso: true, planEstudio: { include: { carrera: true } } },
    });
    return Response.json({ success: true, data: cursoPlan }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}