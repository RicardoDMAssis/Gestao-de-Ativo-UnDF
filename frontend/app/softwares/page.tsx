"use client";

import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/useAuth";
import {
  Monitor,
  Plus,
  Loader2,
  AlertCircle,
  Cpu,
  Trash2,
  Search,
  CheckCircle2,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Laptop,
  Check,
  Ban,
  Building,
  User,
  PlusCircle
} from "lucide-react";

export default function SoftwaresPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"softwares" | "instalar" | "solicitacoes">("softwares");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Data lists
  const [softwares, setSoftwares] = useState<any[]>([]);
  const [instalacoes, setInstalacoes] = useState<any[]>([]);
  const [ativosTI, setAtivosTI] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);

  // Expanded card state
  const [expandedSoftwares, setExpandedSoftwares] = useState<Record<number, boolean>>({});

  // Searches
  const [searchSoftwareQuery, setSearchSoftwareQuery] = useState("");
  const [searchComputerQuery, setSearchComputerQuery] = useState("");
  const [searchSolicitacoesQuery, setSearchSolicitacoesQuery] = useState("");

  // Form Software state (Server only)
  const [modalSoftwareOpen, setModalSoftwareOpen] = useState(false);
  const [submittingSoftware, setSubmittingSoftware] = useState(false);
  const [errorSoftware, setErrorSoftware] = useState<string | null>(null);
  const [softwareNome, setSoftwareNome] = useState("");
  const [softwareFabricante, setSoftwareFabricante] = useState("");
  const [licencas, setLicencas] = useState(1);

  // Form Instalacao Direta state (Server only)
  const [modalInstalacaoOpen, setModalInstalacaoOpen] = useState(false);
  const [submittingInstalacao, setSubmittingInstalacao] = useState(false);
  const [errorInstalacao, setErrorInstalacao] = useState<string | null>(null);
  const [selectedSoftwareId, setSelectedSoftwareId] = useState("");
  const [selectedAtivoTIId, setSelectedAtivoTIId] = useState("");
  const [computerSearch, setComputerSearch] = useState("");

  // Form Solicitação de Instalação (Professor)
  const [modalSolicitacaoOpen, setModalSolicitacaoOpen] = useState(false);
  const [submittingSolicitacao, setSubmittingSolicitacao] = useState(false);
  const [errorSolicitacao, setErrorSolicitacao] = useState<string | null>(null);
  const [solicSoftwareId, setSolicSoftwareId] = useState("");
  const [solicTipoDestino, setSolicTipoDestino] = useState<"individual" | "laboratorio">("individual");
  const [solicAtivoId, setSolicAtivoId] = useState("");
  const [solicSalaId, setSolicSalaId] = useState("");
  const [solicAtivoBusca, setSolicAtivoBusca] = useState("");
  const [solicObservacao, setSolicObservacao] = useState("");

  const isServidor = user?.tipo_usuario === "Servidor" || (user as any)?.is_superuser;
  const isProfessor = user?.tipo_usuario === "Professor";

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resInstalacoes, resSoftwares, resAtivosTI, resSalas, resSolicitacoes] = await Promise.all([
        api.get("/instalacoes-software/"),
        api.get("/softwares/"),
        api.get("/ativos-ti/"),
        api.get("/salas/"),
        api.get("/solicitacoes-instalacao/")
      ]);
      setInstalacoes(resInstalacoes.data.results || resInstalacoes.data || []);
      setSoftwares(resSoftwares.data.results || resSoftwares.data || []);
      setAtivosTI(resAtivosTI.data.results || resAtivosTI.data || []);
      setSalas(resSalas.data.results || resSalas.data || []);
      setSolicitacoes(resSolicitacoes.data.results || resSolicitacoes.data || []);
    } catch (e: any) {
      setError("Não foi possível carregar os dados de softwares e solicitações.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // CRUD Software
  const handleCreateSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSoftware(true);
    setErrorSoftware(null);

    try {
      if (!softwareNome.trim() || !softwareFabricante.trim()) {
        throw new Error("Preencha todos os campos obrigatórios.");
      }

      await api.post("/softwares/", {
        nome: softwareNome,
        fabricante: softwareFabricante,
        total_licencas_compradas: licencas
      });

      setModalSoftwareOpen(false);
      setSoftwareNome("");
      setSoftwareFabricante("");
      setLicencas(1);
      setSucesso("Software cadastrado com sucesso!");
      carregarDados();
    } catch (err: any) {
      setErrorSoftware(err.response?.data?.detail || err.message || "Erro ao salvar.");
    } finally {
      setSubmittingSoftware(false);
    }
  };

  // CRUD Instalacao Direta (Server only)
  const handleCreateInstalacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInstalacao(true);
    setErrorInstalacao(null);

    try {
      if (!selectedSoftwareId || !selectedAtivoTIId) {
        throw new Error("Selecione o software e o computador de TI.");
      }

      await api.post("/instalacoes-software/", {
        software: parseInt(selectedSoftwareId),
        ativo_ti: parseInt(selectedAtivoTIId)
      });

      setModalInstalacaoOpen(false);
      setSelectedSoftwareId("");
      setSelectedAtivoTIId("");
      setComputerSearch("");
      setSucesso("Instalação registrada com sucesso!");
      carregarDados();
    } catch (err: any) {
      setErrorInstalacao(err.response?.data?.detail || err.message || "Erro ao registrar.");
    } finally {
      setSubmittingInstalacao(false);
    }
  };

  // Deletar Instalacao (Server only)
  const handleDeleteInstalacao = async (id: number) => {
    if (!window.confirm("Deseja realmente remover esta instalação?")) return;
    try {
      await api.delete(`/instalacoes-software/${id}/`);
      setSucesso("Instalação desfeita com sucesso.");
      carregarDados();
    } catch (e) {
      console.error(e);
      alert("Falha ao desinstalar software.");
    }
  };

  // Criar Solicitação de Instalação (Professor)
  const handleCreateSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSolicitacao(true);
    setErrorSolicitacao(null);

    const payload: any = {
      software: parseInt(solicSoftwareId),
      observacao: solicObservacao.trim()
    };

    if (solicTipoDestino === "individual") {
      if (!solicAtivoId) {
        setErrorSolicitacao("Selecione um computador de TI.");
        setSubmittingSolicitacao(false);
        return;
      }
      payload.ativo_ti = parseInt(solicAtivoId);
    } else {
      if (!solicSalaId) {
        setErrorSolicitacao("Selecione uma sala/laboratório.");
        setSubmittingSolicitacao(false);
        return;
      }
      payload.sala = parseInt(solicSalaId);
    }

    try {
      await api.post("/solicitacoes-instalacao/", payload);
      setModalSolicitacaoOpen(false);
      setSolicSoftwareId("");
      setSolicAtivoId("");
      setSolicSalaId("");
      setSolicAtivoBusca("");
      setSolicObservacao("");
      setSucesso("Solicitação de instalação enviada com sucesso! Aguarde a análise da equipe de TI.");
      carregarDados();
    } catch (err: any) {
      setErrorSolicitacao(err.response?.data?.detail || "Erro ao criar solicitação.");
    } finally {
      setSubmittingSolicitacao(false);
    }
  };

  // Processar solicitação (Server only)
  const handleProcessarSolicitacao = async (id: number, aprovado: boolean) => {
    let motivo = "";
    if (!aprovado) {
      const resp = window.prompt("Informe o motivo da rejeição da instalação:");
      if (resp === null) return;
      motivo = resp || "Rejeitado pela TI";
    } else {
      if (!window.confirm("Deseja realmente aprovar esta solicitação e realizar a instalação?")) return;
    }

    try {
      await api.post(`/solicitacoes-instalacao/${id}/processar/`, {
        aprovado,
        observacao: motivo
      });
      setSucesso(aprovado ? "Instalação aprovada e executada!" : "Instalação rejeitada.");
      carregarDados();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao processar solicitação.");
    }
  };

  // Filtros
  const filteredSoftwares = softwares.filter((s) => {
    const query = searchSoftwareQuery.toLowerCase();
    return s.nome.toLowerCase().includes(query) || s.fabricante.toLowerCase().includes(query);
  });

  const toggleSoftwareExpanded = (id: number) => {
    setExpandedSoftwares((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredComputersTab = ativosTI.filter((a) => {
    const term = searchComputerQuery.toLowerCase();
    const name = a.ativo_detail?.nome || a.ativo?.nome || "";
    const serial = a.ativo_detail?.serial_patrimonio || a.ativo?.serial_patrimonio || "";
    const brand = a.marca || "";
    const so = a.sistema_operacional || "";
    return (
      name.toLowerCase().includes(term) ||
      serial.toLowerCase().includes(term) ||
      brand.toLowerCase().includes(term) ||
      so.toLowerCase().includes(term)
    );
  });

  const filteredSolicitacoes = solicitacoes.filter((s) => {
    const query = searchSolicitacoesQuery.toLowerCase();
    const softwareName = s.software_detail?.nome || "";
    const solicitanteName = s.solicitante_detail?.nome || "";
    const salaName = s.sala_detail ? `${s.sala_detail.tipo} ${s.sala_detail.numero}` : "";
    const pcName = s.ativo_ti_detail?.ativo_detail?.nome || "";
    return (
      softwareName.toLowerCase().includes(query) ||
      solicitanteName.toLowerCase().includes(query) ||
      salaName.toLowerCase().includes(query) ||
      pcName.toLowerCase().includes(query)
    );
  });

  // Filtragem e busca inline em modal de ativos
  const filteredAtivosTI = ativosTI.filter((a) => {
    const term = computerSearch.toLowerCase();
    const name = a.ativo_detail?.nome || a.ativo?.nome || "";
    const serial = a.ativo_detail?.serial_patrimonio || a.ativo?.serial_patrimonio || "";
    return name.toLowerCase().includes(term) || serial.toLowerCase().includes(term);
  });

  const filteredSolicAtivosTI = ativosTI.filter((a) => {
    const term = solicAtivoBusca.toLowerCase();
    const name = a.ativo_detail?.nome || a.ativo?.nome || "";
    const serial = a.ativo_detail?.serial_patrimonio || a.ativo?.serial_patrimonio || "";
    return name.toLowerCase().includes(term) || serial.toLowerCase().includes(term);
  });

  const openInstalarModal = (id: string, name: string, serial: string) => {
    setSelectedAtivoTIId(id);
    setComputerSearch(`${name} (${serial})`);
    setSelectedSoftwareId("");
    setErrorInstalacao(null);
    setModalInstalacaoOpen(true);
  };

  const labelStatusSolicitacao = (status: string) => {
    switch (status) {
      case "Pendente":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">Pendente</span>;
      case "Aprovada":
        return <span className="bg-green-50 text-green-800 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">Aprovada</span>;
      case "Rejeitada":
        return <span className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold">Rejeitada</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 dark:text-blue-400 flex items-center gap-2">
              <Monitor className="w-8 h-8 text-blue-900 dark:text-blue-400" />
              SAM — Gestão de Softwares & Licenças
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">
              {isServidor
                ? "Controle licenças, implantações de ativos e atenda a chamados de laboratórios da UnDF."
                : "Consulte softwares homologados e solicite a instalação em seus laboratórios."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isServidor && activeTab === "softwares" && (
              <button
                onClick={() => {
                  setErrorSoftware(null);
                  setModalSoftwareOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Software
              </button>
            )}
            {isServidor && activeTab === "instalar" && (
              <button
                onClick={() => {
                  setSelectedAtivoTIId("");
                  setComputerSearch("");
                  setSelectedSoftwareId("");
                  setErrorInstalacao(null);
                  setModalInstalacaoOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                Instalar Software
              </button>
            )}
            {isProfessor && (
              <button
                onClick={() => {
                  setSolicSoftwareId("");
                  setSolicAtivoId("");
                  setSolicSalaId("");
                  setSolicAtivoBusca("");
                  setSolicObservacao("");
                  setErrorSolicitacao(null);
                  setModalSolicitacaoOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Solicitar Instalação
              </button>
            )}
          </div>
        </div>

        {/* Banners */}
        {sucesso && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex justify-between items-center text-sm font-semibold animate-in fade-in duration-200">
            <span>{sucesso}</span>
            <button onClick={() => setSucesso(null)} className="text-green-500 hover:text-green-800 text-xs">Dispensar</button>
          </div>
        )}

        {/* Abas */}
        <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-2">
          <button
            onClick={() => setActiveTab("softwares")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "softwares"
                ? "border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Monitor className="w-4 h-4" />
            Catálogo de Softwares
          </button>
          <button
            onClick={() => setActiveTab("instalar")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "instalar"
                ? "border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Laptop className="w-4 h-4" />
            Softwares por Computador
          </button>
          <button
            onClick={() => setActiveTab("solicitacoes")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "solicitacoes"
                ? "border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Solicitações de Instalação
          </button>
        </div>

        {/* Barra de Busca de Abas */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {activeTab === "softwares" ? (
            <input
              type="text"
              value={searchSoftwareQuery}
              onChange={(e) => setSearchSoftwareQuery(e.target.value)}
              className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              placeholder="Buscar software por nome..."
            />
          ) : activeTab === "instalar" ? (
            <input
              type="text"
              value={searchComputerQuery}
              onChange={(e) => setSearchComputerQuery(e.target.value)}
              className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              placeholder="Buscar computador por patrimônio..."
            />
          ) : (
            <input
              type="text"
              value={searchSolicitacoesQuery}
              onChange={(e) => setSearchSolicitacoesQuery(e.target.value)}
              className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              placeholder="Buscar solicitação por software ou laboratório..."
            />
          )}
        </div>

        {/* Listagem */}
        <div>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Carregando informações...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-650 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : activeTab === "softwares" ? (
            /* TAB 1: SOFTWARES */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSoftwares.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                  Nenhum software cadastrado.
                </div>
              ) : (
                filteredSoftwares.map((s) => {
                  const sInstalls = instalacoes.filter(
                    (ins) => ins.software === s.id || ins.software_detail?.id === s.id
                  );
                  const installed = sInstalls.length;
                  const remaining = s.total_licencas_compradas - installed;
                  const percent = Math.min(100, Math.max(0, (installed / s.total_licencas_compradas) * 100));
                  const isExpanded = !!expandedSoftwares[s.id];

                  return (
                    <div
                      key={s.id}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="bg-primary/5 text-primary p-2.5 rounded-xl">
                            <Monitor className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                              remaining <= 0
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            {remaining <= 0 ? "Esgotado" : `${remaining} Disponíveis`}
                          </span>
                        </div>

                        <div className="mt-4">
                          <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-lg leading-tight truncate">
                            {s.nome}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                            {s.fabricante}
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            <span>Licenças Usadas</span>
                            <span>{installed} / {s.total_licencas_compradas}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="bg-blue-900 h-full transition-all duration-350"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Implantation toggle list */}
                        {installed > 0 && (
                          <div className="mt-6 border-t border-slate-100 dark:border-zinc-850 pt-3">
                            <button
                              onClick={() => toggleSoftwareExpanded(s.id)}
                              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            >
                              <span>Visualizar Instalações</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isExpanded && (
                              <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {sInstalls.map((ins) => {
                                  const cName = ins.ativo_ti_detail?.ativo_detail?.nome || `Ativo TI ${ins.ativo_ti}`;
                                  const cSerial = ins.ativo_ti_detail?.ativo_detail?.serial_patrimonio || "";
                                  return (
                                    <div
                                      key={ins.id}
                                      className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-2 border border-slate-100 dark:border-zinc-800"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate">
                                          {cName}
                                        </p>
                                        {cSerial && (
                                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                                            Patr: {cSerial}
                                          </p>
                                        )}
                                      </div>
                                      {isServidor && (
                                        <button
                                          onClick={() => handleDeleteInstalacao(ins.id)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-md transition-colors cursor-pointer"
                                          title="Desinstalar"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ações Rápidas por Usuário */}
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                        {isProfessor && remaining > 0 && (
                          <button
                            onClick={() => {
                              setSolicSoftwareId(String(s.id));
                              setSolicTipoDestino("individual");
                              setSolicAtivoId("");
                              setSolicSalaId("");
                              setSolicAtivoBusca("");
                              setSolicObservacao("");
                              setModalSolicitacaoOpen(true);
                            }}
                            className="w-full inline-flex justify-center items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer"
                          >
                            <PlusCircle className="w-4.5 h-4.5" />
                            Solicitar Instalação
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === "instalar" ? (
            /* TAB 2: COMPUTARES E SOFTWARES INSTALADOS */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredComputersTab.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                  Nenhum computador de TI localizado.
                </div>
              ) : (
                filteredComputersTab.map((a) => {
                  const computerId = String(a.ativo_detail?.id || a.ativo || a.ativo_id || "");
                  const computerName = a.ativo_detail?.nome || a.ativo?.nome || "Computador";
                  const computerSerial = a.ativo_detail?.serial_patrimonio || a.ativo?.serial_patrimonio || "Sem Patrimônio";
                  const computerBrand = a.marca || "Desconhecido";
                  const computerSO = a.sistema_operacional || "SO não informado";
                  const computerRAM = a.memoria_ram_gb ? `${a.memoria_ram_gb}GB` : "";
                  const computerStorage = a.armazenamento_gb ? `${a.armazenamento_gb}GB` : "";
                  const salaName = a.sala_detail ? `${a.sala_detail.tipo} ${a.sala_detail.numero} (${a.sala_detail.campus_detail?.sigla || ''})` : null;

                  const compInstalls = instalacoes.filter(
                    (ins) => String(ins.ativo_ti) === computerId || String(ins.ativo_ti_detail?.ativo_detail?.id) === computerId
                  );

                  return (
                    <div
                      key={computerId}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base truncate">
                              {computerName}
                            </h3>
                            <span className="inline-block font-mono text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded mt-1">
                              Patr: {computerSerial}
                            </span>
                            {salaName && (
                              <span className="block text-xs font-semibold text-blue-900 mt-1">
                                Local: {salaName}
                              </span>
                            )}
                          </div>
                          <div className="bg-primary/5 text-primary p-2.5 rounded-xl shrink-0">
                            <Laptop className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="mt-3.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          <span>{computerBrand}</span>
                          <span>·</span>
                          <span>{computerSO}</span>
                          {computerRAM && (
                            <>
                              <span>·</span>
                              <span>{computerRAM} RAM</span>
                            </>
                          )}
                          {computerStorage && (
                            <>
                              <span>·</span>
                              <span>{computerStorage} SSD</span>
                            </>
                          )}
                        </div>

                        <div className="mt-6">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                            Softwares Instalados ({compInstalls.length})
                          </h4>
                          {compInstalls.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nenhum software instalado.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {compInstalls.map((ins) => {
                                const sName = ins.software_detail?.nome || `Software ${ins.software}`;
                                return (
                                  <span
                                    key={ins.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300"
                                  >
                                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                                    {sName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {isServidor && (
                        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-zinc-800">
                          <button
                            onClick={() => openInstalarModal(computerId, computerName, computerSerial)}
                            className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-primary dark:text-zinc-300 font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Instalar Software
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* TAB 3: SOLICITAÇÕES DE INSTALAÇÃO (Pendente / Aprovado / Rejeitado) */
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left font-semibold py-3 px-4">Software</th>
                      <th className="text-left font-semibold py-3 px-4">Destino de Instalação</th>
                      <th className="text-left font-semibold py-3 px-4">Solicitante (Prof.)</th>
                      <th className="text-left font-semibold py-3 px-4">Observação</th>
                      <th className="text-left font-semibold py-3 px-4">Status</th>
                      {isServidor && <th className="text-right font-semibold py-3 px-4">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSolicitacoes.length === 0 ? (
                      <tr>
                        <td colSpan={isServidor ? 6 : 5} className="py-16 text-center text-slate-400 italic">
                          Nenhuma solicitação de instalação pendente.
                        </td>
                      </tr>
                    ) : (
                      filteredSolicitacoes.map((solic) => {
                        const softwareName = solic.software_detail?.nome || solic.software;
                        const dest = solic.sala
                          ? `Sala: ${solic.sala_detail?.tipo} ${solic.sala_detail?.numero} (${solic.sala_detail?.campus_detail?.sigla || ''})`
                          : `Máquina: ${solic.ativo_ti_detail?.ativo_detail?.nome || solic.ativo_ti} (Patr: ${solic.ativo_ti_detail?.ativo_detail?.serial_patrimonio || ''})`;
                        const solicitante = solic.solicitante_detail?.nome || `Usuário ${solic.solicitante}`;
                        
                        return (
                          <tr key={solic.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-zinc-200">{softwareName}</td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-blue-900">{dest}</td>
                            <td className="py-3.5 px-4 text-slate-700">{solicitante}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={solic.observacao || "—"}>
                              {solic.observacao || "—"}
                            </td>
                            <td className="py-3.5 px-4">{labelStatusSolicitacao(solic.status)}</td>
                            {isServidor && (
                              <td className="py-3.5 px-4 text-right">
                                {solic.status === "Pendente" ? (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleProcessarSolicitacao(solic.id, true)}
                                      className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs px-2.5 py-1.5 rounded cursor-pointer flex items-center gap-1"
                                      title="Aprovar e Instalar"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Aprovar
                                    </button>
                                    <button
                                      onClick={() => handleProcessarSolicitacao(solic.id, false)}
                                      className="bg-red-650 hover:bg-red-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded cursor-pointer flex items-center gap-1"
                                      title="Rejeitar"
                                    >
                                      <Ban className="w-3.5 h-3.5" /> Rejeitar
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile de Solicitações */}
              <ul className="md:hidden divide-y divide-slate-100">
                {filteredSolicitacoes.map((solic) => {
                  const dest = solic.sala
                    ? `Sala: ${solic.sala_detail?.tipo} ${solic.sala_detail?.numero}`
                    : `Máquina: ${solic.ativo_ti_detail?.ativo_detail?.nome || solic.ativo_ti}`;
                  return (
                    <li key={solic.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{solic.software_detail?.nome}</span>
                        {labelStatusSolicitacao(solic.status)}
                      </div>
                      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <dt className="text-slate-400">Destino</dt>
                          <dd className="text-blue-900 font-semibold">{dest}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Solicitante</dt>
                          <dd className="text-slate-800">{solic.solicitante_detail?.nome}</dd>
                        </div>
                      </dl>
                      {solic.observacao && (
                        <p className="text-[11px] bg-slate-50 p-2 rounded text-slate-500 italic">
                          " {solic.observacao} "
                        </p>
                      )}
                      {isServidor && solic.status === "Pendente" && (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleProcessarSolicitacao(solic.id, true)}
                            className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold text-xs py-2 rounded text-center cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleProcessarSolicitacao(solic.id, false)}
                            className="flex-1 bg-red-650 hover:bg-red-700 text-white font-semibold text-xs py-2 rounded text-center cursor-pointer"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOVO SOFTWARE (Server only) */}
      {modalSoftwareOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base">Adicionar Novo Software</h3>
              <button
                onClick={() => setModalSoftwareOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xl font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSoftware} className="p-6 space-y-4">
              {errorSoftware && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-650 dark:bg-red-950/20 dark:border-red-900/30">
                  {errorSoftware}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Nome do Software</label>
                <input
                  type="text"
                  required
                  value={softwareNome}
                  onChange={(e) => setSoftwareNome(e.target.value)}
                  className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                  placeholder="Ex: Microsoft Office 365"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Fabricante</label>
                <input
                  type="text"
                  required
                  value={softwareFabricante}
                  onChange={(e) => setSoftwareFabricante(e.target.value)}
                  className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                  placeholder="Ex: Microsoft Corporation"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Quantidade de Licenças Adquiridas</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={licencas}
                  onChange={(e) => setLicencas(parseInt(e.target.value))}
                  className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setModalSoftwareOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingSoftware}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {submittingSoftware && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR INSTALAÇÃO (Server only) */}
      {modalInstalacaoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base">Registrar Instalação de Software</h3>
              <button
                onClick={() => setModalInstalacaoOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xl font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateInstalacao} className="p-6 space-y-4">
              {errorInstalacao && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-650 dark:bg-red-950/20 dark:border-red-900/30">
                  {errorInstalacao}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Selecionar Software</label>
                <select
                  required
                  value={selectedSoftwareId}
                  onChange={(e) => setSelectedSoftwareId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-zinc-900 text-foreground"
                >
                  <option value="">Selecione o software...</option>
                  {softwares.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.fabricante})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Buscar Computador (Patrimônio)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={computerSearch}
                    onChange={(e) => setComputerSearch(e.target.value)}
                    className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                    placeholder="Nome do ativo ou patrimônio..."
                  />
                </div>
                {computerSearch.trim() && !selectedAtivoTIId && (
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-zinc-900 shadow-md divide-y divide-slate-100 dark:divide-zinc-800 mt-1">
                    {filteredAtivosTI.length === 0 ? (
                      <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400">Nenhum computador encontrado.</div>
                    ) : (
                      filteredAtivosTI.map((a) => {
                        const aId = String(a.ativo_detail?.id || a.ativo || a.ativo_id || "");
                        const aName = a.ativo_detail?.nome || a.ativo?.nome || "Computador";
                        const aSerial = a.ativo_detail?.serial_patrimonio || a.ativo?.serial_patrimonio || "—";
                        return (
                          <button
                            key={aId}
                            type="button"
                            onClick={() => {
                              setSelectedAtivoTIId(aId);
                              setComputerSearch(`${aName} (${aSerial})`);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-medium text-foreground">{aName}</span>
                            <span className="text-xs text-slate-500 dark:text-zinc-400">Patrimônio: {aSerial}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
                {selectedAtivoTIId && (
                  <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg px-3 py-2 mt-1">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      Computador selecionado
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAtivoTIId("");
                        setComputerSearch("");
                      }}
                      className="text-xs text-red-650 hover:text-red-800 font-semibold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setModalInstalacaoOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingInstalacao}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {submittingInstalacao && <Loader2 className="w-4 h-4 animate-spin" />}
                  Instalar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR INSTALAÇÃO (Professor only) */}
      {modalSolicitacaoOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base">Solicitar Instalação de Software</h3>
              <button
                onClick={() => setModalSolicitacaoOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xl font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSolicitacao} className="p-6 space-y-4">
              {errorSolicitacao && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-650 dark:bg-red-950/20 dark:border-red-900/30">
                  {errorSolicitacao}
                </div>
              )}

              {/* Software */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Software *</label>
                <select
                  required
                  value={solicSoftwareId}
                  onChange={(e) => setSolicSoftwareId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                >
                  <option value="">Selecione o software...</option>
                  {softwares.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.fabricante})</option>
                  ))}
                </select>
              </div>

              {/* Destino Tipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">Tipo de Destino</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="tipoDestino"
                      checked={solicTipoDestino === "individual"}
                      onChange={() => setSolicTipoDestino("individual")}
                      className="text-blue-900"
                    />
                    Computador Individual
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="tipoDestino"
                      checked={solicTipoDestino === "laboratorio"}
                      onChange={() => setSolicTipoDestino("laboratorio")}
                      className="text-blue-900"
                    />
                    Laboratório Completo
                  </label>
                </div>
              </div>

              {/* Se Individual: busca de computadores */}
              {solicTipoDestino === "individual" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Buscar Computador (Patrimônio)</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={solicAtivoBusca}
                      onChange={(e) => setSolicAtivoBusca(e.target.value)}
                      className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                      placeholder="Nome ou patrimônio da máquina..."
                    />
                  </div>
                  {solicAtivoBusca.trim() && !solicAtivoId && (
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-zinc-900 shadow-md divide-y divide-slate-100 dark:divide-zinc-800 mt-1">
                      {filteredSolicAtivosTI.length === 0 ? (
                        <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400">Nenhum computador encontrado.</div>
                      ) : (
                        filteredSolicAtivosTI.map((a) => {
                          const aId = String(a.ativo_detail?.id || a.ativo || a.ativo_id || "");
                          const aName = a.ativo_detail?.nome || a.ativo?.nome || "Computador";
                          const aSerial = a.ativo_detail?.serial_patrimonio || a.ativo?.serial_patrimonio || "—";
                          return (
                            <button
                              key={aId}
                              type="button"
                              onClick={() => {
                                setSolicAtivoId(aId);
                                setSolicAtivoBusca(`${aName} (${aSerial})`);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-medium text-foreground">{aName}</span>
                              <span className="text-xs text-slate-500 dark:text-zinc-400">Patrimônio: {aSerial}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                  {solicAtivoId && (
                    <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg px-3 py-2 mt-1">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        Computador selecionado
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSolicAtivoId("");
                          setSolicAtivoBusca("");
                        }}
                        className="text-xs text-red-650 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Se Laboratório: select de salas */}
              {solicTipoDestino === "laboratorio" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Selecionar Laboratório *</label>
                  <select
                    required
                    value={solicSalaId}
                    onChange={(e) => setSolicSalaId(e.target.value)}
                    className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                  >
                    <option value="">Selecione o laboratório...</option>
                    {salas
                      .filter((s) => s.tipo === "Laboratorio")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.tipo} {s.numero} ({s.campus_detail?.sigla || ''})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Observação / Justificativa */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Justificativa / Observações</label>
                <textarea
                  value={solicObservacao}
                  onChange={(e) => setSolicObservacao(e.target.value)}
                  className="w-full border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 outline-none focus:border-primary text-foreground"
                  placeholder="Informe a disciplina ou finalidade de uso..."
                  rows={3}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setModalSolicitacaoOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingSolicitacao}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {submittingSolicitacao && <Loader2 className="w-4 h-4 animate-spin" />}
                  Solicitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
