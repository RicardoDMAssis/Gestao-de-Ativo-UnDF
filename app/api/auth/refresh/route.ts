import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh_token');

  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token não encontrado' }, { status: 401 });
  }

  // Em um cenário real, chamaria a API externa: POST /api/auth/token/refresh/ com o refreshToken

  // Simulando sucesso no refresh
  const newAccessToken = 'mock_access_token_renovado_99999';

  cookies().set({
    name: 'access_token',
    value: newAccessToken,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 15,
  });

  return NextResponse.json({ message: 'Token atualizado com sucesso' });
}
