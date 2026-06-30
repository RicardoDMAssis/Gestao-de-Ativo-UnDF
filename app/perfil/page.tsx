"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import { UserCircle2, LogOut, BookOpen, Hash, Loader2 } from 'lucide-react';
import { UnDFLogo } from '@/components/UnDFLogo';

export default function PerfilPage() {
  const router = useRouter();
  const { user, fetchUser, logout, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Tenta buscar o usuário ao montar o componente
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-undf-grayLight">
        <div className="flex flex-col items-center text-undf-primary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-undf-grayDark font-medium">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Se não estiver autenticado mesmo após o fetch (por exemplo, token expirou e falhou), redireciona
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-undf-grayLight">
      {/* Header */}
      <header className="bg-undf-white border-b border-undf-gray shadow-sm relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <UnDFLogo className="w-24" showText={false} />
            <h1 className="text-xl font-bold text-undf-primary ml-4">Sistema de Gestão de Patrimônio</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-undf-grayDark hover:text-undf-primaryDark transition-colors text-sm font-medium"
          >
            Sair
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-undf-black">Gestão de Patrimônio</h2>
          <p className="text-undf-grayDark mt-1">Bem-vindo(a) ao Sistema de Gestão de Patrimônio Institucional.</p>
        </div>

        <div className="bg-undf-white rounded-2xl shadow-sm border border-undf-gray overflow-hidden">
          {/* Cover / Perfil Header */}
          <div className="h-32 bg-gradient-to-r from-undf-primaryLight to-undf-primary"></div>
          
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-start -mt-12 mb-8">
              <div className="flex items-start space-x-5">
                <div className="bg-undf-white p-2 rounded-full border-4 border-undf-grayLight shadow-sm shrink-0">
                  <UserCircle2 size={80} className="text-undf-primary" strokeWidth={1.5} />
                </div>
                <div className="pt-16">
                  <h3 className="text-2xl font-bold text-undf-black">{user.nome}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-undf-primaryLighter/30 text-undf-primaryDark">
                      Cargo
                    </span>
                    <span className="text-sm text-undf-grayDark font-medium">
                      Engenharia de Software
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="p-4 rounded-xl border border-undf-gray bg-undf-grayLight/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="bg-undf-white p-2.5 rounded-lg text-undf-primary shadow-sm">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-undf-grayDark">Matrícula Funcional</p>
                  <p className="text-lg font-semibold text-undf-black mt-0.5">{user.matricula}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-undf-gray bg-undf-grayLight/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="bg-undf-white p-2.5 rounded-lg text-undf-primary shadow-sm">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-undf-grayDark">Lotação / Departamento</p>
                  <p className="text-lg font-semibold text-undf-black mt-0.5">Sede Central / TI</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-undf-gray flex justify-end">
              <button 
                disabled 
                className="inline-flex items-center px-4 py-2 border border-undf-gray rounded-lg shadow-sm text-sm font-medium text-undf-grayDark bg-undf-grayLight cursor-not-allowed"
                title="Funcionalidade em desenvolvimento"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
