import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pegamos o cookie de token de acesso para ver se está autenticado
  const accessToken = request.cookies.get('access_token')?.value;

  // Se o usuário não tiver o token e estiver tentando acessar rotas protegidas
  if (!accessToken && request.nextUrl.pathname.startsWith('/perfil')) {
    // Redireciona para o login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário já tiver o token e tentar acessar login, mande-o para o perfil
  if (accessToken && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/perfil', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Executa o middleware nas rotas listadas
  matcher: ['/perfil/:path*', '/login', '/'],
};
