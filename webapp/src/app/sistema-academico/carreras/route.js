export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';




export async function GET() {
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
  try {
    const body = await request.json();
    const { codigo, nombre, facultad, activo } = body;

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
        activo:   activo ?? true,
      },
    });
    return Response.json({ success: true, data: carrera }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
