import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, matricula } = body;

    if (!email || !matricula) {
      return NextResponse.json({ error: "E-mail e matrícula são obrigatórios" }, { status: 400 });
    }

    // Chama o backend Django (token JWT).
    // Usamos a matricula como a "senha" padrão para autenticação no Django,
    // mas se for digitada uma senha normal, ela será enviada no campo matricula.
    const response = await fetch(`${BACKEND_URL}/auth/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: matricula,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Falha na autenticação. E-mail ou senha incorretos." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const accessToken = data.access;
    const refreshToken = data.refresh;

    // Busca perfil do usuário de forma síncrona no servidor para evitar race conditions no cliente
    let user = null;
    try {
      const meResponse = await fetch(`${BACKEND_URL}/usuarios/me/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (meResponse.ok) {
        user = await meResponse.json();
      }
    } catch (e) {
      console.error("Erro ao buscar me no login:", e);
    }

    cookies().set({
      name: "access_token",
      value: accessToken,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hora
    });

    cookies().set({
      name: "refresh_token",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json({ message: "Autenticado com sucesso", user });
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
