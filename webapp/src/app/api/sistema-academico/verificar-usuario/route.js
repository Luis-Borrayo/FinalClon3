import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY');
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return Response.json(
        { error: "Se requiere el parámetro id (carnet o código de catedrático)" },
        { status: 400 }
      );
    }

    // Buscar alumno por carnet
    const alumno = await prisma.alumno.findUnique({
      where: { carnet: id },
      select: {
        id: true,
        carnet: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true,
      },
    });

    if (alumno) {
      return Response.json({
        found: true,
        id: alumno.carnet,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        email: alumno.email,
        rol: "ALUMNO",
        activo: alumno.activo,
      });
    }

    // Buscar catedrático por código
    const catedratico = await prisma.catedraticoAcademico.findUnique({
      where: { codigo: id },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true,
      },
    });

    if (catedratico) {
      return Response.json({
        found: true,
        id: catedratico.codigo,
        nombre: catedratico.nombre,
        apellido: catedratico.apellido,
        email: catedratico.email,
        rol: "CATEDRATICO",
        activo: catedratico.activo,
      });
    }

    return Response.json({ found: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}