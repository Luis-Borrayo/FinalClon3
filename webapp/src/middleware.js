import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/',
  '/api/parqueo/auth',
  '/kiosco',
  '/_next',
  '/favicon',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Permitir archivos estáticos
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Verificar cookie de sesión
  const auth = request.cookies.get('auth')?.value;
  if (!auth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
