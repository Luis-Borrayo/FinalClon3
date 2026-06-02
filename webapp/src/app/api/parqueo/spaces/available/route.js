import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const type = searchParams.get('type');
  const campus_id = searchParams.get('campus_id');

  try {
    const where = { status: 'AVAILABLE', is_active: true };
    if (zone) where.zone = zone;
    if (type) where.type = type;
    if (campus_id) where.campus_id = campus_id;

    const spaces = await prisma.parkingSpace.findMany({
      where,
      orderBy: [{ zone: 'asc' }, { code: 'asc' }],
    });
    return res.ok({ count: spaces.length, spaces });
  } catch (e) {
    return res.error(e.message);
  }
}
