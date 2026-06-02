/**
 * server-auth.js
 * Auth helpers para Server Actions y Server Components (no tienen request).
 * Usa next/headers para leer la cookie access_token.
 */
import { cookies } from 'next/headers';
import { verifyAccess } from '@/lib/jwt';

/**
 * Devuelve el usuario del JWT desde la cookie, o null si no está autenticado.
 */
export async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;
  try {
    return verifyAccess(token);
  } catch {
    return null;
  }
}

/**
 * Lanza un Error si el usuario no está autenticado o no tiene el rol requerido.
 * Uso en Server Actions:
 *   await requireServerRole('ADMIN', 'TEACHER');
 */
export async function requireServerRole(...allowedRoles) {
  const user = await getServerUser();
  if (!user) throw new Error('No autenticado');
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error('Sin permisos para esta acción');
  }
  return user;
}
