"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import { UserCircle2, LogOut, BookOpen, Hash, Loader2 } from 'lucide-react';
import { UnDFLogo } from '@/components/UnDFLogo';

import { Layout } from '@/components/Layout';

export default function PerfilPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getTipoUsuarioLabel = () => {
    switch (user.tipo_usuario) {
      case 'Aluno': return 'Aluno';
      case 'Professor': return 'Professor';
      case 'Servidor': return 'Servidor';
      default: return 'Usuário';
    }
  };

  const getCargoCursoLabel = () => {
    if (user.tipo_usuario === 'Aluno') {
      return user.aluno_profile?.curso_detail?.nome ? `${user.aluno_profile.curso_detail.nome} (${user.aluno_profile.semestre}º Semestre)` : 'Aluno';
    }
    if (user.tipo_usuario === 'Professor') {
      return user.professor_profile?.regime_trabalho ? `Professor (${user.professor_profile.regime_trabalho})` : 'Professor';
    }
    if (user.tipo_usuario === 'Servidor') {
      return user.servidor_profile?.cargo || 'Servidor Administrador';
    }
    return 'Administrador';
  };

  const getLotacaoLabel = () => {
    if (user.tipo_usuario === 'Servidor') {
      return user.servidor_profile?.setor_detail?.nome || 'Reitoria / Administração';
    }
    if (user.tipo_usuario === 'Professor') {
      return 'Departamento Acadêmico';
    }
    if (user.tipo_usuario === 'Aluno') {
      return user.aluno_profile?.curso_detail?.escola_detail?.nome || 'Escola da UnDF';
    }
    return 'Geral';
  };

  return (
    <Layout>
      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-4">
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
                      {getTipoUsuarioLabel()}
                    </span>
                    <span className="text-sm text-undf-grayDark font-medium">
                      {getCargoCursoLabel()}
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
                  <p className="text-sm font-medium text-undf-grayDark">Matrícula Funcional / Acadêmica</p>
                  <p className="text-lg font-semibold text-undf-black mt-0.5">{user.matricula}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-undf-gray bg-undf-grayLight/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="bg-undf-white p-2.5 rounded-lg text-undf-primary shadow-sm">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-undf-grayDark">Lotação / Escola / Curso</p>
                  <p className="text-lg font-semibold text-undf-black mt-0.5">{getLotacaoLabel()}</p>
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
      </div>
    </Layout>
  );
}
