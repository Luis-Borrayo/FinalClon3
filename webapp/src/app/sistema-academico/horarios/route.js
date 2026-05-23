import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const horarios = await prisma.horario.findMany({
      include: {
        curso: true,
        catedratico: true,
      },
    });
    return Response.json({ success: true, data: horarios });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const horario = await prisma.horario.create({
      data: {
        cursoId: body.cursoId,
        catedraticoId: body.catedraticoId,
        dia: body.dia,
        horaInicio: body.horaInicio,
        horaFin: body.horaFin,
        salon: body.salon,
      },
    });
    return Response.json({ success: true, data: horario }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}