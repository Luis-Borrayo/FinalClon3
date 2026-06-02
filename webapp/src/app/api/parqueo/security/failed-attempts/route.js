import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '50');

  try {
    // Intentos fallidos = logs de acceso denegado en auditoría
    const denied = await prisma.auditLog.findMany({
      where: { action: { in: ['ACCESS_DENIED', 'BLACKLIST_ATTEMPT', 'FORCED_ENTRY', 'LOGIN_FAILED'] } },
      take: limit,
      include: { user: { select: { id: true, first_name: true, last_name: true } } },
      orderBy: { created_at: 'desc' },
    });

    // Complementar con vehículos en blacklist que hayan intentado entrar (sesiones rechazadas)
    const blVehicles = await prisma.vehicle.findMany({
      where: { blacklisted: true, deleted_at: null },
      select: { id: true, placa: true, blacklist_reason: true, updated_at: true },
      take: 20,
    });

    const fromDenied = denied.map(log => {
      const meta = log.metadata ?? {};
      return {
        id:           log.id,
        timestamp:    log.created_at,
        placa:        meta.placa ?? meta.vehicle_plate ?? (log.user ? `${log.user.first_name} ${log.user.last_name}` : null),
        reason:       log.action === 'LOGIN_FAILED' ? 'INVALID_CREDENTIALS' : log.action,
        method:       meta.method ?? 'SISTEMA',
        access_point: meta.access_point ?? meta.gate ?? 'Sistema',
      };
    });

    const fromBlacklist = blVehicles.map(v => ({
      id:           `bl-${v.id}`,
      timestamp:    v.updated_at,
      placa:        v.placa,
      reason:       'BLACKLISTED',
      method:       'SISTEMA',
      access_point: 'Barrera principal',
    }));

    // Combinar, ordenar por fecha, limitar
    const all = [...fromDenied, ...fromBlacklist]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return res.ok(all);
  } catch (e) {
    return res.error(e.message);
  }
}
