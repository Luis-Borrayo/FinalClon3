import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/sistema-academico/verificar-usuario?id=<carnet_or_codigo>
 *
 * Verifica si un usuario existe en el sistema académico y devuelve:
 *   - nombre, apellido
 *   - rol: "ALUMNO" | "CATEDRATICO"
 *   - activo: true (siempre true si existe — extender si se agrega campo activo)
 *
 * Usado por otros módulos (ej. parqueo) para validar identidad antes de crear cuenta.
 *
 * Respuestas:
 *   200 { found: true,  id, nombre, apellido, email, rol, activo }
 *   200 { found: false }
 *   400 { error: "Se requiere el parámetro id" }
 *   500 { error: "..." }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return Response.json(
        { error: "Se requiere el parámetro id (carnet o código de catedrático)" },
        { status: 400 }
      );
    }

    // Search alumnos first (by carnet)
    const alumno = await prisma.alumno.findUnique({
      where: { carnet: id },
      select: {
        id: true,
        carnet: true,
        nombre: true,
        apellido: true,
        email: true,
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
        activo: true,
      });
    }

    // Search catedraticos (by codigo)
    const catedratico = await prisma.catedraticoAcademico.findUnique({
      where: { codigo: id },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
        email: true,
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
        activo: true,
      });
    }

    // Not found in either table
    return Response.json({ found: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
