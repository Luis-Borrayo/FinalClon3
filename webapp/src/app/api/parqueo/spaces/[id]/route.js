import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY');
  if (error) return error;

  try {
    const { id } = await params;
    const space = await prisma.parkingSpace.findUnique({
      where: { id },
      include: { campus: true, sessions: { where: { status: 'ACTIVE' }, take: 1, include: { vehicle: true, user: { select: { id: true, first_name: true, last_name: true } } } } },
    });
    if (!space) return res.notFound('Espacio no encontrado');
    return res.ok(space);
  } catch (e) {
    return res.error(e.message);
  }
}

export async function PATCH(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  try {
    const { id } = await params;
    const dto = await request.json();
    const space = await prisma.parkingSpace.update({ where: { id }, data: dto });
    return res.ok(space, 'Espacio actualizado');
  } catch (e) {
    return res.error(e.message);
  }
}

export async function DELETE(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.parkingSpace.delete({ where: { id } });
    return res.ok(null, 'Espacio eliminado');
  } catch (e) {
    return res.error(e.message);
  }
}
