import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function PATCH(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id } = await params;
    const { lat, lng } = await request.json();
    const space = await prisma.parkingSpace.update({ where: { id }, data: { lat, lng } });
    return res.ok(space, 'Posición actualizada');
  } catch (e) {
    return res.error(e.message);
  }
}
