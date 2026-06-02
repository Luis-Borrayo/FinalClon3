import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT');
  if (error) return error;

  try {
    const carreras = await prisma.carrera.findMany({
      include: { _count: { select: { alumnos: true } } },
      orderBy: { nombre: "asc" },
    });
    return Response.json({ success: true, data: carreras });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body = await request.json();
    const { codigo, nombre, facultad, nivel, activo } = body;

    if (!codigo || !nombre) {
      return Response.json({ success: false, error: "codigo y nombre son requeridos" }, { status: 400 });
    }

    const existeCodigo = await prisma.carrera.findUnique({ where: { codigo } });
    if (existeCodigo) {
      return Response.json({ success: false, error: `La carrera con código ${codigo} ya existe` }, { status: 409 });
    }

    const carrera = await prisma.carrera.create({
      data: {
        codigo,
        nombre,
        facultad: facultad ?? null,
        nivel: nivel ?? "LICENCIATURA",
        activo: activo ?? true,
      },
    });
    return Response.json({ success: true, data: carrera }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body = await request.json();
    const { id, alumnoId, codigo, nombre, facultad, nivel, activo } = body;

    if (!id) {
      return Response.json({ success: false, error: "id es requerido" }, { status: 400 });
    }

    // Verificar que la carrera existe
    const carrera = await prisma.carrera.findUnique({ where: { id: parseInt(id) } });
    if (!carrera) {
      return Response.json({ success: false, error: "Carrera no encontrada" }, { status: 404 });
    }

    // Si viene alumnoId, asignar la carrera al alumno
    if (alumnoId) {
      const alumno = await prisma.alumno.findUnique({ where: { id: parseInt(alumnoId) } });
      if (!alumno) {
        return Response.json({ success: false, error: "Alumno no encontrado" }, { status: 404 });
      }

      const alumnoActualizado = await prisma.alumno.update({
        where: { id: parseInt(alumnoId) },
        data: { carreraId: parseInt(id) },
        include: { carrera: true },
      });

      return Response.json({
        success: true,
        message: `Carrera "${carrera.nombre}" asignada a ${alumno.nombre} ${alumno.apellido}`,
        data: alumnoActualizado,
      });
    }

    // Si no viene alumnoId, actualizar los datos de la carrera
    const carreraActualizada = await prisma.carrera.update({
      where: { id: parseInt(id) },
      data: {
        ...(codigo && { codigo }),
        ...(nombre && { nombre }),
        ...(facultad !== undefined && { facultad }),
        ...(nivel && { nivel }),
        ...(activo !== undefined && { activo }),
      },
    });

    return Response.json({ success: true, data: carreraActualizada });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}