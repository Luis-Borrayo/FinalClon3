import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function POST(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.notFound('Pago no encontrado');
    if (payment.status !== 'COMPLETED') return res.error('Solo se pueden reembolsar pagos completados');

    const updated = await prisma.payment.update({ where: { id }, data: { status: 'REFUNDED' } });
    return res.ok(updated, 'Pago reembolsado');
  } catch (e) {
    return res.error(e.message);
  }
}
