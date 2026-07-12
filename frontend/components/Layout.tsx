"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { api } from "@/lib/axios";
import { LogOut, UserCircle2, Loader2, Package, Calendar, BookOpen, Building2, Monitor, AlertCircle, Info, CheckCircle, Users } from "lucide-react";
import { UnDFLogo } from "@/components/UnDFLogo";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchUser, logout, isLoading, isAuthenticated } = useAuth();
  const [notificacoes, setNotificacoes] = useState<string[]>([]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Checa se algum empréstimo pendente foi aprovado ou rejeitado
  useEffect(() => {
    if (!user || user.tipo_usuario === "Servidor") return;

    const checarNotificacoes = async () => {
      try {
        const res = await api.get("/emprestimos/meus/");
        const meusEmprestimos = res.data.results || res.data || [];
        
        const cacheKey = `notified_loans_${user.id}`;
        const cacheRaw = localStorage.getItem(cacheKey);
        const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
        
        const novasNotifs: string[] = [];
        const novoCache: Record<string, string> = {};
        
        meusEmprestimos.forEach((emp: any) => {
          const empId = String(emp.id);
          const statusAtual = emp.status; // 'Pendente', 'Ativo', 'Cancelado', etc.
          const statusAntigo = cache[empId];
          
          novoCache[empId] = statusAtual;
          
          // Só notifica se havia um estado anterior rastreado
          if (statusAntigo) {
            if (statusAntigo === "Pendente" && statusAtual === "Ativo") {
              novasNotifs.push(
                `Sua solicitação de empréstimo do ativo "${emp.ativo_detail?.nome || emp.ativo?.nome}" foi APROVADA! Dirija-se à secretaria de seu campus para retirá-lo.`
              );
            } else if (statusAntigo === "Pendente" && statusAtual === "Cancelado") {
              const motivo = emp.observacao_devolucao || "Não especificado.";
              novasNotifs.push(
                `Sua solicitação de empréstimo do ativo "${emp.ativo_detail?.nome || emp.ativo?.nome}" foi REJEITADA. Motivo: ${motivo}`
              );
            }
          } else {
            // Se for o primeiro acesso pós-criação da solicitação e já estiver aprovado/rejeitado,
            // registramos no cache para não notificar de forma redundante no futuro
          }
        });
        
        localStorage.setItem(cacheKey, JSON.stringify(novoCache));
        
        if (novasNotifs.length > 0) {
          setNotificacoes(novasNotifs);
        }
      } catch (err) {
        console.error("Erro ao verificar notificações de empréstimo:", err);
      }
    };
    
    checarNotificacoes();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center text-primary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-muted-foreground font-medium">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  const getNavItems = () => {
    const items = [
      { name: "Catálogo", href: "/ativos", icon: Package },
      { name: "Corpo Acadêmico", href: "/corpo-academico", icon: Users }
    ];

    if (user.tipo_usuario === "Aluno") {
      items.push(
        { name: "Meus Empréstimos", href: "/emprestimos", icon: Calendar },
        { name: "Minhas Atividades", href: "/atividades", icon: BookOpen }
      );
    } else if (user.tipo_usuario === "Professor") {
      items.push(
        { name: "Atividades Acadêmicas", href: "/atividades", icon: BookOpen },
        { name: "Empréstimos", href: "/emprestimos", icon: Calendar },
        { name: "Softwares", href: "/softwares", icon: Monitor }
      );
    } else {
      // Servidor / Administrador
      items.push(
        { name: "Empréstimos", href: "/emprestimos", icon: Calendar },
        { name: "Instituição", href: "/instituicao", icon: Building2 },
        { name: "Softwares (SAM)", href: "/softwares", icon: Monitor },
        { name: "Atividades Acadêmicas", href: "/atividades", icon: BookOpen }
      );
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground flex flex-col md:flex-row">
      {/* ────────────────────────────────────────────────────────────────────────
          DESKTOP SIDEBAR
          ──────────────────────────────────────────────────────────────────────── */}
      <aside className="group fixed top-0 bottom-0 left-0 z-40 hidden md:flex flex-col justify-between bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 w-16 hover:w-64 transition-all duration-300 ease-in-out shadow-md overflow-hidden">
        {/* Top: Logo */}
        <div className="flex flex-col">
          <Link href="/ativos" className="flex items-center gap-3 px-3.5 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="shrink-0 w-9 h-9 flex items-center justify-center">
              <UnDFLogo className="w-9 shrink-0" showText={false} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold text-primary text-base whitespace-nowrap overflow-hidden">
              Patrimônio UnDF
            </span>
          </Link>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden font-medium">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Profile & Logout */}
        <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-800">
          {/* Profile link */}
          <Link
            href="/perfil"
            className={`flex items-center gap-3 p-3 transition-colors ${
              pathname === "/perfil"
                ? "bg-primary/5 text-primary"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCircle2 size={24} className="text-primary shrink-0" />
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden leading-tight">
              <span className="text-sm font-semibold truncate text-foreground">{user.nome}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user.tipo_usuario}</span>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-zinc-100 dark:border-zinc-800 transition-colors cursor-pointer"
          >
            <LogOut size={20} className="shrink-0 text-red-500" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap overflow-hidden">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────────────────
          MOBILE LAYOUT
          ──────────────────────────────────────────────────────────────────────── */}
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/ativos" className="flex items-center">
          <UnDFLogo className="w-16" showText={false} />
          <span className="text-sm font-bold text-primary ml-2">Patrimônio UnDF</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/perfil" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <UserCircle2 size={20} className="text-primary" />
            <span className="text-xs font-semibold max-w-[80px] truncate">{user.nome}</span>
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Sair"
            className="p-1.5 text-red-600 hover:bg-zinc-50 rounded-md transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────────
          CONTENT AREA & MOBILE NAVIGATION
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 md:pl-16 min-w-0 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          {/* Notificações de Empréstimos Aprovados / Rejeitados */}
          {notificacoes.map((notif, index) => (
            <div key={index} className="bg-blue-50/90 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 p-4 rounded-xl flex items-start gap-3 shadow-md mb-4 animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm font-semibold leading-relaxed">
                {notif}
              </div>
              <button
                onClick={() => setNotificacoes(prev => prev.filter((_, idx) => idx !== index))}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2"
              >
                Dispensar
              </button>
            </div>
          ))}

          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex justify-around z-40 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
