import { requireRole } from '@/lib/jwt';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';

export async function GET(request, { params }) {
  const { user, error } = requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (session_id) {
      const session = await prisma.parkingSession.findUnique({
        where: { id: session_id },
        include: { payment: true },
      });
      if (!session) return res.notFound('Sesión no encontrada');
      return res.ok({ session_id, is_paid: session.is_paid, amount_due: session.amount_due, payment: session.payment });
    }

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.notFound('Pago no encontrado');
    return res.ok(payment);
  } catch (e) {
    return res.error(e.message);
  }
}
