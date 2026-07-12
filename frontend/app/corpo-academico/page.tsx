"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";
import { Search, Loader2, User, Building, BookOpen, Shield } from "lucide-react";

export default function CorpoAcademicoPage() {
  const [activeTab, setActiveTab] = useState<"Servidor" | "Professor" | "Aluno">("Servidor");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await api.get(`/usuarios/?tipo_usuario=${activeTab}&page_size=200`);
      const results = response.data.results || response.data || [];
      setUsuarios(results);
    } catch (err: any) {
      console.error(err);
      setErro("Falha ao carregar diretório acadêmico.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchQuery.toLowerCase();
    const nome = u.nome.toLowerCase();
    const nomeSocial = u.nome_social ? u.nome_social.toLowerCase() : "";
    const email = u.email.toLowerCase();
    const matricula = u.matricula.toLowerCase();

    return (
      nome.includes(term) ||
      nomeSocial.includes(term) ||
      email.includes(term) ||
      matricula.includes(term)
    );
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Diretório Acadêmico (Corpo da Faculdade)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Consulte o corpo de servidores, docentes e discentes ativos na UnDF.
          </p>
        </div>

        {/* Abas e Busca */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
            <button
              onClick={() => {
                setActiveTab("Servidor");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "Servidor"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Servidores
            </button>
            <button
              onClick={() => {
                setActiveTab("Professor");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "Professor"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Professores
            </button>
            <button
              onClick={() => {
                setActiveTab("Aluno");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "Aluno"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Alunos
            </button>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-zinc-450 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, matrícula..."
              className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-900/20 text-foreground"
            />
          </div>
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-250/60 dark:border-zinc-800 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <span className="text-xs font-medium">Buscando pessoas...</span>
          </div>
        ) : erro ? (
          <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold">
            {erro}
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-250/60 dark:border-zinc-800 rounded-2xl text-xs">
            Nenhuma pessoa localizada.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsuarios.map((u) => {
              const displayNome = u.nome_social ? `${u.nome_social} (${u.nome})` : u.nome;

              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow transition-all duration-200 flex items-start gap-4"
                >
                  {/* Foto de Perfil / Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    {u.foto_url ? (
                      <img src={u.foto_url} alt={u.nome} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                    )}
                  </div>

                  {/* Informações */}
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm text-zinc-850 dark:text-zinc-100 truncate" title={displayNome}>
                        {displayNome}
                      </h4>
                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-semibold truncate">
                        Matrícula: {u.matricula}
                      </p>
                    </div>

                    <p className="text-[11px] text-zinc-650 dark:text-zinc-350 truncate">
                      {u.email}
                    </p>

                    {/* Detalhes Específicos do Cargo/Curso */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 mt-1">
                      {activeTab === "Servidor" && u.servidor_detail && (
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-450 space-y-0.5">
                          <p><strong className="text-zinc-700 dark:text-zinc-300">Cargo:</strong> {u.servidor_detail.cargo}</p>
                          <p><strong className="text-zinc-700 dark:text-zinc-300">Setor:</strong> {u.servidor_detail.setor_nome || "N/A"}</p>
                        </div>
                      )}
                      {activeTab === "Professor" && u.professor_detail && (
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-450 space-y-0.5">
                          <p><strong className="text-zinc-700 dark:text-zinc-300">Regime:</strong> {u.professor_detail.regime_trabalho}</p>
                        </div>
                      )}
                      {activeTab === "Aluno" && u.aluno_detail && (
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-450 space-y-0.5">
                          <p><strong className="text-zinc-700 dark:text-zinc-300">Curso:</strong> {u.aluno_detail.curso_nome || "N/A"}</p>
                          <p><strong className="text-zinc-700 dark:text-zinc-300">Ingresso:</strong> {u.aluno_detail.ano_ingresso}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
