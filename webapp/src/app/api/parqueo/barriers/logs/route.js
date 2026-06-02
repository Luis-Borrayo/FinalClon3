import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const barrier_id = searchParams.get('barrier_id');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  try {
    const where = barrier_id ? { barrier_id } : {};
    const [total, data] = await Promise.all([
      prisma.barrierLog.count({ where }),
      prisma.barrierLog.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { operator: { select: { id: true, first_name: true, last_name: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ]);
    return res.ok({ total, page, limit, data });
  } catch (e) {
    return res.error(e.message);
  }
}
