import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const asignaciones = await prisma.asignacion.findMany({
      include: {
        alumno: true,
        curso: true,
      },
    });
    return Response.json({ success: true, data: asignaciones });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const asignacion = await prisma.asignacion.create({
      data: {
        alumnoId: body.alumnoId,
        cursoId: body.cursoId,
        ciclo: body.ciclo,
      },
    });
    return Response.json({ success: true, data: asignacion }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}