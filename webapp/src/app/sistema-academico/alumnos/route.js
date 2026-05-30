export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { enviarCorreoBienvenidaConQR } from "@/lib/email";



export async function GET() {
  try {
    const alumnos = await prisma.alumno.findMany({
      include: {
        asignaciones: true,
        carrera: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: alumnos });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.carnet || !body.nombre || !body.apellido || !body.email) {
      return Response.json(
        { success: false, error: "carnet, nombre, apellido y email son requeridos" },
        { status: 400 }
      );
    }

    // Create the student
    const alumno = await prisma.alumno.create({
      data: {
        carnet:    body.carnet,
        nombre:    body.nombre,
        apellido:  body.apellido,
        email:     body.email,
        carreraId: body.carreraId ?? null,
      },
    });

    // Send welcome email with QR code (non-blocking — don't fail if email fails)
    enviarCorreoBienvenidaConQR({
      nombre:   alumno.nombre,
      apellido: alumno.apellido,
      email:    alumno.email,
      carnet:   alumno.carnet,
    }).catch((err) => {
      console.error("[email] Error enviando correo de bienvenida:", err.message);
    });

    return Response.json(
      { success: true, data: alumno, message: "Alumno registrado. Se enviará un correo con su QR." },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
