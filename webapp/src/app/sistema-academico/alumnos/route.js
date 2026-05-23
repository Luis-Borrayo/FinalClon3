import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const alumnos = await prisma.alumno.findMany();
    return Response.json({ success: true, data: alumnos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const alumno = await prisma.alumno.create({
      data: {
        carnet: body.carnet,
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email,
      },
    });
    return Response.json({ success: true, data: alumno }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}