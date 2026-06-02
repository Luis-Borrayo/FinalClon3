import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

const SEVERITY_MAP = {
  ACCESS_DENIED:     'HIGH',
  BLACKLIST_ATTEMPT: 'CRITICAL',
  FORCED_ENTRY:      'CRITICAL',
  OVERSTAY:          'MEDIUM',
  PAYMENT_FAILED:    'MEDIUM',
  MANUAL_OVERRIDE:   'LOW',
  LOGIN:             'INFO',
  LOGOUT:            'INFO',
  LOGIN_FAILED:      'HIGH',
  VEHICLE_CREATED:   'INFO',
  VEHICLE_UPDATED:   'INFO',
  SESSION_STARTED:   'INFO',
  SESSION_ENDED:     'INFO',
};

function mapLog(log) {
  const meta = log.metadata ?? {};
  const severity = SEVERITY_MAP[log.action] ?? 'INFO';
  return {
    id:          log.id,
    created_at:  log.created_at,
    event_type:  log.action,
    severity,
    placa:       meta.placa ?? meta.vehicle_plate ?? null,
    space_code:  meta.space_code ?? null,
    description: meta.description ?? meta.message ?? `${log.action} en ${log.resource ?? 'sistema'}`,
    operator:    log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Sistema',
    ip_address:  log.ip_address,
    resource:    log.resource,
    resource_id: log.resource_id,
  };
}

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page   = parseInt(searchParams.get('page')  ?? '1');
  const limit  = parseInt(searchParams.get('limit') ?? '20');
  const action = searchParams.get('action');
  const from   = searchParams.get('from');
  const to     = searchParams.get('to');

  try {
    const where = {};
    if (action) where.action = { contains: action };
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to)   where.created_at.lte = new Date(to);
    }

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { user: { select: { id: true, first_name: true, last_name: true, role: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return res.ok({ total, page, limit, data: data.map(mapLog) });
  } catch (e) {
    return res.error(e.message);
  }
}
