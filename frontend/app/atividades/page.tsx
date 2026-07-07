"use client";

import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/useAuth";
import {
  BookOpen,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  User,
  Check,
  Building,
  GraduationCap,
  Calendar
} from "lucide-react";

export default function AtividadesPage() {
  const { user } = useAuth();
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroCampus, setFiltroCampus] = useState("");

  const [cursos, setCursos] = useState<any[]>([]);
  const [campi, setCampi] = useState<any[]>([]);

  // Form states for creating
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // List of students for autocomplete/selection (Server/Professor only)
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunoSearch, setAlunoSearch] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState("");

  // Form fields
  const [tipo, setTipo] = useState("Monitoria");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [numeroProcesso, setNumeroProcesso] = useState("");

  const isProfessorOrServidor = user?.tipo_usuario === "Servidor" || user?.tipo_usuario === "Professor" || (user as any)?.is_superuser;
  const isServidor = user?.tipo_usuario === "Servidor" || (user as any)?.is_superuser;

  const carregarDadosFiltros = async () => {
    try {
      const [resCursos, resCampi] = await Promise.all([
        api.get("/cursos/"),
        api.get("/campi/")
      ]);
      setCursos(resCursos.data.results || resCursos.data || []);
      setCampi(resCampi.data.results || resCampi.data || []);
    } catch (e) {
      console.error("Erro ao carregar dados de filtros", e);
    }
  };

  const carregarAtividades = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroStatus) params.set("status", filtroStatus);
      if (filtroCurso) params.set("aluno__curso", filtroCurso);
      if (filtroCampus) params.set("aluno__curso__campus", filtroCampus);

      const res = await api.get(`/atividades-academicas/?${params.toString()}`);
      setAtividades(res.data.results || res.data || []);
    } catch (e: any) {
      setError("Não foi possível carregar as atividades acadêmicas.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const carregarAlunos = async () => {
    if (!isProfessorOrServidor) return;
    try {
      const res = await api.get(`/alunos/?search=${encodeURIComponent(alunoSearch)}`);
      setAlunos(res.data.results || res.data || []);
    } catch (e) {
      console.error("Erro ao carregar alunos", e);
    }
  };

  useEffect(() => {
    carregarAtividades();
  }, [filtroTipo, filtroStatus, filtroCurso, filtroCampus]);

  useEffect(() => {
    carregarDadosFiltros();
  }, []);

  useEffect(() => {
    if (alunoSearch.trim() && isProfessorOrServidor) {
      const t = setTimeout(carregarAlunos, 300);
      return () => clearTimeout(t);
    }
  }, [alunoSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    // Validação extra do frontend
    if (tipo !== "Monitoria" && !numeroProcesso.trim()) {
      setFormError("O número do processo é obrigatório para atividades que não sejam Monitoria.");
      setSubmitting(false);
      return;
    }

    try {
      let alunoIdStr = selectedAlunoId;
      if (!isProfessorOrServidor) {
        // Se for aluno logado, puxamos o id dele direto do profile do auth
        const usr = user as any;
        if (usr?.aluno_detail?.id || usr?.id) {
          alunoIdStr = String(usr.aluno_detail?.id || usr.id);
        } else {
          throw new Error("Seu perfil de aluno não foi localizado. Contate o administrador.");
        }
      }

      if (!alunoIdStr || !tipo || !dataInicio) {
        throw new Error("Preencha todos os campos obrigatórios.");
      }

      await api.post("/atividades-academicas/", {
        aluno: parseInt(alunoIdStr),
        tipo: tipo,
        status: "Em_Andamento",
        descricao: descricao.trim() || undefined,
        data_inicio: dataInicio,
        data_fim: dataFim || undefined,
        numero_processo: tipo !== "Monitoria" ? numeroProcesso.trim() : undefined
      });

      setModalOpen(false);
      // Reset form
      setSelectedAlunoId("");
      setAlunoSearch("");
      setDescricao("");
      setDataInicio("");
      setDataFim("");
      setNumeroProcesso("");
      setSucesso("Vínculo de atividade criado com sucesso! " + (isServidor ? "" : "Aguarde a aprovação da TI."));
      carregarAtividades();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.message || "Erro ao registrar atividade.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprovarAtividade = async (id: number) => {
    if (!window.confirm("Deseja realmente aprovar esta atividade acadêmica?")) return;
    try {
      await api.post(`/atividades-academicas/${id}/aprovar/`);
      setSucesso("Atividade acadêmica aprovada com sucesso!");
      carregarAtividades();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao aprovar atividade.");
    }
  };

  const getTipoDisplay = (val: string) => {
    const mapping: Record<string, string> = {
      Estagio_Obrigatorio: "Estágio Obrigatório",
      Estagio_Nao_Obrigatorio: "Estágio Não Obrigatório",
      PIBIC: "PIBIC",
      PIVIC: "PIVIC",
      Extensao: "Extensão",
      Monitoria: "Monitoria",
      Trabalho_Academico: "Trabalho Acadêmico",
      PIBID: "PIBID",
      Empresa_Junior: "Empresa Júnior",
      Publicacao_Cientifica: "Publicação Científica",
      Organizacao_Evento: "Organização de Evento",
      Atividade_Cultural_Esportiva: "Atividade Cultural/Esportiva"
    };
    return mapping[val] || val;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-900" />
              Projetos & Atividades Acadêmicas
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Visualize, registre e filtre os projetos acadêmicos (Monitoria, PIBIC, Estágios) que habilitam empréstimos patrimoniais.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Vincular Novo Projeto
          </button>
        </div>

        {/* Banners */}
        {sucesso && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex justify-between items-center text-sm font-semibold animate-in fade-in duration-200">
            <span>{sucesso}</span>
            <button onClick={() => setSucesso(null)} className="text-green-500 hover:text-green-800 text-xs">Dispensar</button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros de Busca</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tipo */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Tipo de Projeto</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none bg-slate-50 dark:bg-zinc-800 text-foreground"
              >
                <option value="">Todos os tipos</option>
                <option value="Monitoria">Monitoria</option>
                <option value="PIBIC">PIBIC</option>
                <option value="PIVIC">PIVIC</option>
                <option value="Extensao">Projeto de Extensão</option>
                <option value="Estagio_Obrigatorio">Estágio Obrigatório</option>
                <option value="Estagio_Nao_Obrigatorio">Estágio Não Obrigatório</option>
                <option value="Trabalho_Academico">Trabalho Acadêmico</option>
                <option value="PIBID">PIBID</option>
                <option value="Empresa_Junior">Empresa Júnior</option>
                <option value="Publicacao_Cientifica">Publicação Científica</option>
                <option value="Organizacao_Evento">Organização de Evento</option>
                <option value="Atividade_Cultural_Esportiva">Atividade Cultural/Esportiva</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none bg-slate-50 dark:bg-zinc-800 text-foreground"
              >
                <option value="">Todos os status</option>
                <option value="Em_Andamento">Em Andamento</option>
                <option value="Concluida">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            {/* Curso */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Curso</label>
              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none bg-slate-50 dark:bg-zinc-800 text-foreground"
              >
                <option value="">Todos os cursos</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Campus */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Campus</label>
              <select
                value={filtroCampus}
                onChange={(e) => setFiltroCampus(e.target.value)}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none bg-slate-50 dark:bg-zinc-800 text-foreground"
              >
                <option value="">Todos os campi</option>
                {campi.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.sigla})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listagem */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Carregando atividades...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-650 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : atividades.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">Nenhuma atividade acadêmica localizada</p>
              <p className="text-sm text-slate-400 mt-1">
                Tente redefinir os filtros de busca acima ou vincule um novo projeto.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-6">Aluno</th>
                    <th className="py-3.5 px-6">Curso / Campus</th>
                    <th className="py-3.5 px-6">Projeto</th>
                    <th className="py-3.5 px-6">Processo</th>
                    <th className="py-3.5 px-6">Vigência</th>
                    <th className="py-3.5 px-6">Aprovação</th>
                    <th className="py-3.5 px-6">Status</th>
                    {isServidor && <th className="py-3.5 px-6 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {atividades.map((at) => {
                    const alunoNome = at.aluno_detail?.usuario?.nome || "Estudante";
                    const alunoMatr = at.aluno_detail?.usuario?.matricula || "";
                    const cursoSigla = at.aluno_detail?.curso_detail?.sigla || "";
                    const campusSigla = at.aluno_detail?.curso_detail?.campus_detail?.sigla || "";
                    
                    return (
                      <tr key={at.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{alunoNome}</div>
                          <div className="text-xs text-slate-500 font-mono">{alunoMatr}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-slate-800 font-medium">{cursoSigla || "—"}</div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">{campusSigla}</div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {getTipoDisplay(at.tipo)}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                          {at.numero_processo || <span className="text-slate-400 italic">Sem Processo</span>}
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-slate-650">
                          {at.data_inicio} a {at.data_fim || "Indeterminado"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${
                            at.aprovada 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {at.aprovada ? "Aprovada" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            at.status === "Em_Andamento" 
                              ? "bg-amber-100 text-amber-800" 
                              : at.status === "Concluida"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {at.status === "Em_Andamento" && <Clock className="w-3.5 h-3.5" />}
                            {at.status === "Concluida" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {at.status === "Cancelada" && <XCircle className="w-3.5 h-3.5" />}
                            {at.status === "Em_Andamento" ? "Em Andamento" : at.status === "Concluida" ? "Concluída" : "Cancelada"}
                          </span>
                        </td>
                        {isServidor && (
                          <td className="py-4 px-6 text-right">
                            {!at.aprovada && (
                              <button
                                onClick={() => handleAprovarAtividade(at.id)}
                                className="bg-green-705 hover:bg-green-800 text-white text-xs font-bold py-1.5 px-3 rounded cursor-pointer transition-colors"
                              >
                                Aprovar
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Vincular Atividade */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Vincular Projeto Acadêmico</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-650 border border-red-200 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Busca e seleção do aluno (só para professores e servidores) */}
              {isProfessorOrServidor ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Buscar Estudante *</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={alunoSearch}
                      onChange={(e) => setAlunoSearch(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                      placeholder="Digite o nome ou matrícula do aluno..."
                    />
                  </div>
                  {alunos.length > 0 && !selectedAlunoId && (
                    <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-md divide-y divide-slate-100 mt-1">
                      {alunos.map((al) => (
                        <button
                          key={al.usuario_id}
                          type="button"
                          onClick={() => {
                            setSelectedAlunoId(String(al.usuario_id));
                            setAlunoSearch(`${al.usuario?.nome} (${al.usuario?.matricula})`);
                            setAlunos([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-sm flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-medium">{al.usuario?.nome}</span>
                          <span className="text-xs text-slate-500">Matrícula: {al.usuario?.matricula}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedAlunoId && (
                    <div className="flex items-center justify-between bg-blue-50/50 border border-blue-200 rounded-lg px-3 py-2 mt-1">
                      <span className="text-sm font-medium text-blue-900 flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        Aluno selecionado
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlunoId("");
                          setAlunoSearch("");
                        }}
                        className="text-xs text-red-650 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-650 font-semibold">
                  Você está registrando um projeto para o seu próprio perfil de Aluno: <strong className="text-slate-800">{user?.nome} ({user?.matricula})</strong>.
                </div>
              )}

              {/* Tipo de projeto */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tipo de Projeto *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                >
                  <option value="Monitoria">Monitoria</option>
                  <option value="PIBIC">PIBIC (Iniciação Científica Bolsa)</option>
                  <option value="PIVIC">PIVIC (Iniciação Científica Voluntária)</option>
                  <option value="Extensao">Projeto de Extensão</option>
                  <option value="Estagio_Obrigatorio">Estágio Obrigatório</option>
                  <option value="Estagio_Nao_Obrigatorio">Estágio Não Obrigatório</option>
                  <option value="Trabalho_Academico">Trabalho Acadêmico / TCC</option>
                  <option value="PIBID">PIBID</option>
                  <option value="Empresa_Junior">Empresa Júnior</option>
                  <option value="Publicacao_Cientifica">Publicação Científica</option>
                  <option value="Organizacao_Evento">Organização de Evento</option>
                  <option value="Atividade_Cultural_Esportiva">Atividade Cultural/Esportiva</option>
                </select>
              </div>

              {/* Número do Processo (Exigido se não for Monitoria) */}
              {tipo !== "Monitoria" && (
                <div className="space-y-1 animate-in slide-in-from-top duration-150">
                  <label className="text-xs font-semibold text-slate-650 block">Número do Processo SEI *</label>
                  <input
                    type="text"
                    required
                    value={numeroProcesso}
                    onChange={(e) => setNumeroProcesso(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                    placeholder="Ex: 00123-00004562/2026-89"
                  />
                </div>
              )}

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Descrição/Justificativa</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                  placeholder="Justifique o vínculo ou detalhe o projeto..."
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Data de Fim (Opcional)</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-75 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Vincular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );

  function resetForm() {
    setSelectedAlunoId("");
    setAlunoSearch("");
    setDescricao("");
    setDataInicio("");
    setDataFim("");
    setNumeroProcesso("");
    setFormError(null);
  }
}
