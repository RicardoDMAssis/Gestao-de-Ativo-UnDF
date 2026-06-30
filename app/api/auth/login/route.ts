import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, matricula } = body;

    // Validação básica mockada
    if (!email || !matricula) {
      return NextResponse.json({ error: 'E-mail e matrícula são obrigatórios' }, { status: 400 });
    }

    // Em um cenário real, você faria um POST para o backend externo aqui
    // const res = await fetch('https://backend.undf.edu.br/api/auth/token/', { ... })
    // const data = await res.json()

    // Mockando tokens
    const accessToken = 'mock_access_token_12345';
    const refreshToken = 'mock_refresh_token_67890';

    // Armazenando tokens em cookies HttpOnly via Next.js
    cookies().set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 15, // 15 minutos (exemplo)
    });

    cookies().set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json({ message: 'Autenticado com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
