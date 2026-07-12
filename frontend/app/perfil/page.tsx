"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import { api } from '@/lib/axios';
import { UserCircle2, BookOpen, Hash, Loader2, Camera, X } from 'lucide-react';
import { Layout } from '@/components/Layout';

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [nomeSocial, setNomeSocial] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilErro, setPerfilErro] = useState<string | null>(null);
  
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    if (user) {
      setNomeSocial(user.nome_social || "");
    }
  }, [user]);

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

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/usuarios/upload-foto/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await refreshUser();
      alert("Foto de perfil atualizada com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Erro ao enviar a imagem.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    setPerfilErro(null);

    try {
      await api.patch('/usuarios/me/', {
        nome_social: nomeSocial.trim() || null,
      });
      await refreshUser();
      setEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setPerfilErro("Erro ao salvar as informações do perfil.");
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const displayNome = user.nome_social ? `${user.nome_social} (${user.nome})` : user.nome;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Gestão de Patrimônio</h2>
          <p className="text-zinc-550 mt-1">Bem-vindo(a) ao Sistema de Gestão de Patrimônio Institucional.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Cover / Perfil Header */}
          <div className="h-32 bg-gradient-to-r from-blue-900/10 to-blue-900"></div>
          
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-start -mt-12 mb-8">
              <div className="flex items-start space-x-5">
                {/* Avatar com upload e loader */}
                <div className="relative group bg-white dark:bg-zinc-900 p-1 rounded-full border-4 border-zinc-100 dark:border-zinc-800 shadow-sm shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-850">
                    {uploadingFoto ? (
                      <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                    ) : user.foto_url ? (
                      <img src={user.foto_url} alt={user.nome} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 size={80} className="text-blue-900" strokeWidth={1.5} />
                    )}
                  </div>
                  
                  {/* Botão de Câmera */}
                  <label className="absolute bottom-0 right-0 p-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-full cursor-pointer shadow border-2 border-white dark:border-zinc-900 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFotoUpload} 
                      className="hidden" 
                      disabled={uploadingFoto}
                    />
                  </label>
                </div>

                <div className="pt-14">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{displayNome}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-400">
                      {getTipoUsuarioLabel()}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                      {getCargoCursoLabel()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-lg text-blue-900 dark:text-blue-400 shadow-sm">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-550 dark:text-zinc-455">Matrícula Funcional / Acadêmica</p>
                  <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{user.matricula}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-lg text-blue-900 dark:text-blue-400 shadow-sm">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-550 dark:text-zinc-455">Lotação / Escola / Curso</p>
                  <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{getLotacaoLabel()}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button 
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-zinc-250 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Perfil */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-zinc-850 dark:text-zinc-200 text-base">Editar Perfil</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 rounded-lg outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPerfil} className="p-6 space-y-4">
              {perfilErro && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold">
                  {perfilErro}
                </div>
              )}

              {/* Nome Social */}
              <div className="space-y-1">
                <label htmlFor="nome-social" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                  Nome Social (Como prefere ser chamado)
                </label>
                <input
                  id="nome-social"
                  type="text"
                  value={nomeSocial}
                  onChange={(e) => setNomeSocial(e.target.value)}
                  placeholder="Seu nome social..."
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 text-foreground"
                />
              </div>

              {/* Matrícula (Bloqueado) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase block">
                  Matrícula (Campo Bloqueado)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.matricula}
                  className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg px-3 py-2 text-sm outline-none text-zinc-450 dark:text-zinc-550 cursor-not-allowed"
                />
              </div>

              {/* Lotação (Bloqueado) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-455 dark:text-zinc-500 uppercase block">
                  Lotação / Escola / Curso (Campo Bloqueado)
                </label>
                <input
                  type="text"
                  disabled
                  value={getLotacaoLabel()}
                  className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg px-3 py-2 text-sm outline-none text-zinc-455 dark:text-zinc-550 cursor-not-allowed"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-400 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoPerfil}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-75"
                >
                  {salvandoPerfil && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
