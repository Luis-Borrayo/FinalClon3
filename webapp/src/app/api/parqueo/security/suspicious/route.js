import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET() {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const [blacklistedSessions, longSessions, failedEntries] = await Promise.all([
      prisma.parkingSession.findMany({
        where: { vehicle: { blacklisted: true } },
        take: 10,
        include: { vehicle: true, space: true },
        orderBy: { entry_time: 'desc' },
      }),
      prisma.parkingSession.findMany({
        where: { status: 'ACTIVE', entry_time: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
        take: 10,
        include: { vehicle: true, space: true },
        orderBy: { entry_time: 'asc' },
      }),
      prisma.auditLog.findMany({
        where: { action: 'LOGIN_FAILED' },
        take: 10,
        include: { user: { select: { id: true, first_name: true, last_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return res.ok({ blacklisted_sessions: blacklistedSessions, long_sessions: longSessions, failed_entries: failedEntries });
  } catch (e) {
    return res.error(e.message);
  }
}
