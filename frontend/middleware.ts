import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;

  // Proxy API requests to Django (except local /api/auth/ and /api/usuarios/me)
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/') && 
      request.nextUrl.pathname !== '/api/usuarios/me') {
    let path = request.nextUrl.pathname.replace('/api/', '');
    if (path && !path.endsWith('/') && !path.includes('.')) {
      path += '/';
    }
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000/api';
    const targetUrl = `${backendUrl}/${path}${request.nextUrl.search}`;
    
    const requestHeaders = new Headers(request.headers);
    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
    
    return NextResponse.rewrite(new URL(targetUrl), {
      request: {
        headers: requestHeaders,
      }
    });
  }

  const protectedRoutes = ['/perfil', '/ativos', '/emprestimos', '/dashboard', '/instituicao', '/atividades', '/softwares'];
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (!accessToken && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (accessToken && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/ativos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/perfil/:path*', '/ativos/:path*', '/emprestimos/:path*', '/dashboard/:path*', '/instituicao/:path*', '/atividades/:path*', '/softwares/:path*', '/login', '/', '/api/:path*'],
};
