import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const catedraticos = await prisma.catedraticoAcademico.findMany();
    return Response.json({ success: true, data: catedraticos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const catedratico = await prisma.catedraticoAcademico.create({
      data: {
        codigo: body.codigo,
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email,
      },
    });
    return Response.json({ success: true, data: catedratico }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
