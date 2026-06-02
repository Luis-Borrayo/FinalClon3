import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function POST(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  try {
    const { space_code, status } = await request.json();
    const space = await prisma.parkingSpace.findUnique({ where: { code: space_code } });
    if (!space) return res.notFound('Espacio no encontrado');

    const newStatus = status === 'OCCUPIED' ? 'OCCUPIED' : 'AVAILABLE';
    const updated = await prisma.parkingSpace.update({
      where: { id: space.id },
      data: { status: newStatus, last_sensor_update: new Date() },
    });

    return res.ok(updated, 'Estado actualizado por sensor');
  } catch (e) {
    return res.error(e.message);
  }
}
