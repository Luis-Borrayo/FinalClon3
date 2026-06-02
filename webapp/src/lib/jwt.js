import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no definido en .env.local');
if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET no definido en .env.local');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function signAccess(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function signRefresh(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccess(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefresh(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

export function getTokenFromRequest(request) {
  // 1. Authorization header (Bearer token)
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  // 2. Cookie access_token (login sets HttpOnly cookie)
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  return null;
}

export function getUserFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  try {
    return verifyAccess(token);
  } catch {
    return null;
  }
}

/**
 * requireRole(request, ...roles)
 * Verifica autenticación y opcionalmente que el rol esté permitido.
 * Uso:
 *   const { user, error } = requireRole(request, 'ADMIN', 'TEACHER');
 *   if (error) return error;
 */
export function requireRole(request, ...allowedRoles) {
  const user = getUserFromRequest(request);
  if (!user) {
    return {
      user: null,
      error: Response.json({ success: false, error: 'No autenticado' }, { status: 401 }),
    };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: Response.json({ success: false, error: 'Sin permisos para esta acción' }, { status: 403 }),
    };
  }
  return { user, error: null };
}
