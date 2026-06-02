import { requireRole } from '@/lib/jwt';
import * as res from '@/lib/response';

// LIMITANTE: el estado de barreras se guarda en memoria (Map).
// Se reinicia con cada reinicio del servidor Next.js.
// Para estado persistente, usar BarrierLog: el estado real es el último
// registro por barrier_id en esa tabla.
const barriers = new Map([
  ['barrier-entrada-a', { id: 'barrier-entrada-a', name: 'Entrada Zona A', location: 'Zona A Norte', is_open: false, is_blocked: false, last_action: null, last_action_at: null }],
  ['barrier-salida-a', { id: 'barrier-salida-a', name: 'Salida Zona A', location: 'Zona A Sur', is_open: false, is_blocked: false, last_action: null, last_action_at: null }],
  ['barrier-entrada-b', { id: 'barrier-entrada-b', name: 'Entrada Zona B', location: 'Zona B Norte', is_open: false, is_blocked: false, last_action: null, last_action_at: null }],
  ['barrier-salida-b', { id: 'barrier-salida-b', name: 'Salida Zona B', location: 'Zona B Sur', is_open: false, is_blocked: false, last_action: null, last_action_at: null }],
]);

export { barriers };

export async function GET(request) {
  const { user, error } = requireRole(request, 'ADMIN', 'SECURITY');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const barrier_id = searchParams.get('barrier_id');

  if (barrier_id) {
    const b = barriers.get(barrier_id);
    if (!b) return res.notFound('Barrera no encontrada');
    return res.ok(b);
  }
  return res.ok(Array.from(barriers.values()));
}
