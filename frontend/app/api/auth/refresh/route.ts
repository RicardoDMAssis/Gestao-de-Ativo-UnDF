import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000/api";

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token não encontrado" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Falhou o refresh, limpa os cookies
      cookies().delete("access_token");
      cookies().delete("refresh_token");
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const data = await response.json();
    const newAccessToken = data.access;

    cookies().set({
      name: "access_token",
      value: newAccessToken,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hora
    });

    return NextResponse.json({ message: "Token atualizado com sucesso" });
  } catch (error) {
    console.error("Refresh proxy error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
