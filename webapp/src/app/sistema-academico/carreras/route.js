import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const carreras = await prisma.carrera.findMany({
      include: {
        _count: { select: { alumnos: true } },
      },
      orderBy: { nombre: "asc" },
    });
    return Response.json({ success: true, data: carreras });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.codigo || !body.nombre) {
      return Response.json(
        { success: false, error: "codigo y nombre son requeridos" },
        { status: 400 }
      );
    }

    const carrera = await prisma.carrera.create({
      data: {
        codigo:   body.codigo,
        nombre:   body.nombre,
        facultad: body.facultad ?? null,
        activo:   body.activo ?? true,
      },
    });
    return Response.json({ success: true, data: carrera }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
