export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';




export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: { nombre: "asc" },
      include: { horarios: { include: { catedratico: true } } },
    });
    return Response.json({ success: true, data: cursos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { codigo, nombre, creditos } = body;

    // Validaciones
    if (!codigo || !nombre || !creditos) {
      return Response.json({ success: false, error: "Todos los campos son requeridos: codigo, nombre, creditos" }, { status: 400 });
    }

    if (creditos < 1 || creditos > 10) {
      return Response.json({ success: false, error: "Los créditos deben estar entre 1 y 10" }, { status: 400 });
    }

    // Verificar código duplicado
    const existeCodigo = await prisma.curso.findUnique({ where: { codigo } });
    if (existeCodigo) {
      return Response.json({ success: false, error: `El curso con código ${codigo} ya existe` }, { status: 409 });
    }

    const curso = await prisma.curso.create({
      data: { codigo, nombre, creditos: parseInt(creditos) },
    });
    return Response.json({ success: true, data: curso }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}