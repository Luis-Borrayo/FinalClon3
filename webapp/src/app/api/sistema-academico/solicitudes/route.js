import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT');
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    const where = {};
    if (estado) where.estado = estado;

    const solicitudes = await prisma.solicitudInscripcion.findMany({
      where,
      include: { carrera: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: solicitudes });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'STUDENT');
  if (error) return error;

  try {
    const body = await request.json();
    const { nombre, apellido, email, telefono, carreraId } = body;

    if (!nombre || !apellido || !email || !telefono || !carreraId) {
      return Response.json({ success: false, error: "Todos los campos son requeridos" }, { status: 400 });
    }

    // Verificar que no tenga una solicitud pendiente con el mismo email
    const solicitudExiste = await prisma.solicitudInscripcion.findFirst({
      where: { email, estado: "PENDIENTE" },
    });
    if (solicitudExiste) {
      return Response.json({ success: false, error: "Ya tienes una solicitud pendiente con este correo" }, { status: 409 });
    }

    // Verificar que no sea alumno ya registrado
    const alumnoExiste = await prisma.alumno.findUnique({ where: { email } });
    if (alumnoExiste) {
      return Response.json({ success: false, error: "Ya existe un alumno registrado con este correo" }, { status: 409 });
    }

    const solicitud = await prisma.solicitudInscripcion.create({
      data: { nombre, apellido, email, telefono, carreraId: parseInt(carreraId) },
      include: { carrera: true },
    });
    return Response.json({ success: true, data: solicitud, message: "Solicitud enviada exitosamente. Te notificaremos por correo." }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'STUDENT');
  if (error) return error;

  try {
    const body = await request.json();
    const { id, estado, motivo } = body;

    if (!id || !estado) {
      return Response.json({ success: false, error: "id y estado son requeridos" }, { status: 400 });
    }

    const solicitud = await prisma.solicitudInscripcion.findUnique({
      where: { id: parseInt(id) },
      include: { carrera: true },
    });
    if (!solicitud) {
      return Response.json({ success: false, error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Si se aprueba, crear el alumno automáticamente
    if (estado === "APROBADA") {
      // Generar carnet automático formato 260xxxx
      const ultimoAlumno = await prisma.alumno.findFirst({
        where: { carnet: { startsWith: "26" } },
        orderBy: { carnet: "desc" },
      });

      let nuevoCarnet;
      if (ultimoAlumno) {
        const ultimoNumero = parseInt(ultimoAlumno.carnet.replace("26", ""));
        nuevoCarnet = `26${String(ultimoNumero + 1).padStart(5, "0")}`;
      } else {
        nuevoCarnet = "2600001";
      }

      // Generar contraseña temporal
      const passwordTemporal = `USPG-${nuevoCarnet}`;

      // Crear el alumno
      const alumno = await prisma.alumno.create({
        data: {
          carnet: nuevoCarnet,
          nombre: solicitud.nombre,
          apellido: solicitud.apellido,
          email: solicitud.email,
          password: passwordTemporal,
          carreraId: solicitud.carreraId,
        },
      });

      // Actualizar solicitud
      await prisma.solicitudInscripcion.update({
        where: { id: parseInt(id) },
        data: { estado: "APROBADA" },
      });

      return Response.json({
        success: true,
        message: `Solicitud aprobada. Alumno creado con carnet ${nuevoCarnet}.`,
        data: { alumno, passwordTemporal },
      });
    }

    // Si se rechaza
    await prisma.solicitudInscripcion.update({
      where: { id: parseInt(id) },
      data: { estado: "RECHAZADA", motivo: motivo ?? null },
    });

    return Response.json({ success: true, message: "Solicitud rechazada." });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}