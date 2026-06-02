/**
 * GET /api/parqueo/auth
 * Devuelve los datos del usuario autenticado (incluye qr_code para Mi QR).
 */
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as res from '@/lib/response';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return res.error('No autenticado', 401);

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id:            true,
        email:         true,
        first_name:    true,
        last_name:     true,
        role:          true,
        qr_code:       true,
        carnet:        true,
        is_active:     true,
        last_login_at: true,
        created_at:    true,
      },
    });

    if (!dbUser) return res.error('Usuario no encontrado', 404);

    return res.ok({
      ...dbUser,
      nombre:   dbUser.first_name,
      apellido: dbUser.last_name,
    });
  } catch (e) {
    return res.error('Error al obtener usuario: ' + e.message);
  }
}
