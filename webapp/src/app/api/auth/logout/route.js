/**
 * POST /api/auth/logout
 * Borra las cookies HttpOnly desde el servidor (JavaScript no puede hacerlo).
 */
export const dynamic = 'force-dynamic';

export async function POST() {
  const clearCookie = (name) =>
    `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  const res = Response.json({ success: true });
  res.headers.append('Set-Cookie', clearCookie('access_token'));
  res.headers.append('Set-Cookie', clearCookie('refresh_token'));
  return res;
}
