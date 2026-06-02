import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT');
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const carreraId = searchParams.get("carreraId");

    const where = {};
    if (carreraId) where.carreraId = parseInt(carreraId);

    const planes = await prisma.planEstudio.findMany({
      where,
      include: {
        carrera: true,
        cursos: {
          include: { curso: true },
          orderBy: { semestre: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: planes });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body = await request.json();
    const { carreraId, nombre, version, totalCreditos } = body;

    // Validaciones
    if (!carreraId || !nombre || !version || !totalCreditos) {
      return Response.json({ success: false, error: "Todos los campos son requeridos: carreraId, nombre, version, totalCreditos" }, { status: 400 });
    }

    // Verificar que la carrera existe
    const carrera = await prisma.carrera.findUnique({ where: { id: parseInt(carreraId) } });
    if (!carrera) {
      return Response.json({ success: false, error: "La carrera no existe" }, { status: 404 });
    }

    // Verificar versión duplicada en la misma carrera
    const versionExiste = await prisma.planEstudio.findFirst({
      where: { carreraId: parseInt(carreraId), version },
    });
    if (versionExiste) {
      return Response.json({ success: false, error: `Ya existe un plan de estudio versión ${version} para esta carrera` }, { status: 409 });
    }

    const plan = await prisma.planEstudio.create({
      data: {
        carreraId: parseInt(carreraId),
        nombre,
        version,
        totalCreditos: parseInt(totalCreditos),
      },
      include: { carrera: true },
    });
    return Response.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}