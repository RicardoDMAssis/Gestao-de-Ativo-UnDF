import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token');

  if (!accessToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Em um cenário real, você faria um GET para a API externa passando o Bearer accessToken
  
  // Retornando mock de perfil do usuário
  return NextResponse.json({
    nome: 'João da Silva',
    matricula: '20231UNDF0001',
    cargoCurso: 'Engenharia de Software',
    tipoUsuario: 'Aluno'
  });
}
