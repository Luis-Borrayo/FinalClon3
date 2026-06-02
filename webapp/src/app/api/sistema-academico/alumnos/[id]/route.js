import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma-academico";

export async function DELETE(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    if (isNaN(id)) {
      return Response.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    // Check the student exists
    const alumno = await prisma.alumno.findUnique({ where: { id } });
    if (!alumno) {
      return Response.json({ success: false, error: "Alumno no encontrado" }, { status: 404 });
    }

    // Delete related records first (asignaciones, asistencias)
    await prisma.asistencia.deleteMany({ where: { alumnoId: id } });
    await prisma.asignacion.deleteMany({ where: { alumnoId: id } });
    await prisma.alumno.delete({ where: { id } });

    return Response.json({ success: true, message: `Alumno ${alumno.carnet} eliminado correctamente` });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
