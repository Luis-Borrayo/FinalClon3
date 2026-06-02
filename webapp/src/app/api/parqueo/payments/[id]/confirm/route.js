import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function POST(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id } = await params;
    const dto = await request.json().catch(() => ({}));
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.notFound('Pago no encontrado');
    if (payment.status !== 'PENDING') return res.error('Solo se pueden confirmar pagos pendientes');

    const [updated] = await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: 'COMPLETED', transaction_reference: dto.transaction_reference, paid_at: new Date() },
      }),
      prisma.parkingSession.update({ where: { id: payment.session_id }, data: { is_paid: true } }),
    ]);

    return res.ok(updated, 'Pago confirmado');
  } catch (e) {
    return res.error(e.message);
  }
}
