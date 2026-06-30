import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('access_token');
  cookies().delete('refresh_token');
  
  return NextResponse.json({ message: 'Logout realizado com sucesso' });
}
