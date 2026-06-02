import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'TEACHER', 'STUDENT', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const campus_id = searchParams.get('campus_id');

  try {
    const where = campus_id ? { campus_id } : {};

    const [total, available, occupied, reserved, maintenance] = await Promise.all([
      prisma.parkingSpace.count({ where: { ...where, is_active: true } }),
      prisma.parkingSpace.count({ where: { ...where, status: 'AVAILABLE', is_active: true } }),
      prisma.parkingSpace.count({ where: { ...where, status: 'OCCUPIED' } }),
      prisma.parkingSpace.count({ where: { ...where, status: 'RESERVED' } }),
      prisma.parkingSpace.count({ where: { ...where, status: 'MAINTENANCE' } }),
    ]);

    const byZone = await prisma.parkingSpace.groupBy({
      by: ['zone', 'status'],
      where,
      _count: true,
    });

    const zoneStats = {};
    for (const row of byZone) {
      if (!zoneStats[row.zone]) zoneStats[row.zone] = { total: 0, available: 0, occupied: 0 };
      zoneStats[row.zone][row.status.toLowerCase()] = row._count;
      zoneStats[row.zone].total += row._count;
    }

    return res.ok({ total, available, occupied, reserved, maintenance, occupancy_rate: total > 0 ? Math.round((occupied / total) * 100) : 0, by_zone: zoneStats });
  } catch (e) {
    return res.error(e.message);
  }
}
