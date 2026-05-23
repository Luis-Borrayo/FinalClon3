import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany();
    return Response.json({ success: true, data: cursos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const curso = await prisma.curso.create({
      data: {
        codigo: body.codigo,
        nombre: body.nombre,
        creditos: body.creditos,
      },
    });
    return Response.json({ success: true, data: curso }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}