import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const asistencias = await prisma.asistencia.findMany({
      include: {
        alumno: true,
        horario: {
          include: {
            curso: true,
            catedratico: true,
          },
        },
      },
    });
    return Response.json({ success: true, data: asistencias });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const asistencia = await prisma.asistencia.create({
      data: {
        alumnoId: body.alumnoId,
        horarioId: body.horarioId,
        fecha: new Date(body.fecha),
        presente: body.presente,
      },
    });
    return Response.json({ success: true, data: asistencia }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}