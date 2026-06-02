import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const is_active = searchParams.get('is_active');

  try {
    const where = {};
    if (is_active !== null && is_active !== undefined) where.is_active = is_active === 'true';

    const [total, data] = await Promise.all([
      prisma.blacklist.count({ where }),
      prisma.blacklist.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          vehicle: true,
          added_by: { select: { id: true, first_name: true, last_name: true } },
          removed_by: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);
    return res.ok({ total, page, limit, data });
  } catch (e) {
    return res.error(e.message);
  }
}
