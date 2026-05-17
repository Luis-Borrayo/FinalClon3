import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const vehicle_id = searchParams.get('vehicle_id');
  const user_id = searchParams.get('user_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const where = { status: { not: 'ACTIVE' } };
    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (user_id) where.user_id = user_id;
    if (from || to) {
      where.entry_time = {};
      if (from) where.entry_time.gte = new Date(from);
      if (to) where.entry_time.lte = new Date(to);
    }

    const [total, sessions] = await Promise.all([
      prisma.parkingSession.count({ where }),
      prisma.parkingSession.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { vehicle: true, space: true, user: { select: { id: true, first_name: true, last_name: true } } },
        orderBy: { entry_time: 'desc' },
      }),
    ]);
    return res.ok({ total, page, limit, sessions });
  } catch (e) {
    return res.error(e.message);
  }
}
