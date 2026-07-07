"use client";

import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/useAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Search,
  Calendar,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Filter,
  Plus,
  Loader2,
  Car,
  Monitor,
  Sofa,
  Boxes,
  ThumbsUp,
  Smile,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  User,
} from "lucide-react";

/* ---------- Tipos ---------- */

type StatusEmprestimo = "pendente" | "ativo" | "concluido" | "atrasado" | "finalizado";
type EstadoAtivo = "Excelente" | "Bom" | "Regular" | "Danificado";
type Categoria = "Mobilia" | "TI" | "Veiculo" | "Outros";

interface Ativo {
  id: string;
  nome: string;
  categoria: Categoria;
  marca?: string;
  ram?: string;
  armazenamento?: string;
}
interface Usuario {
  id: string;
  nome: string;
  setor?: string;
  matricula?: string;
}
interface Emprestimo {
  id: string;
  ativo: Ativo;
  usuario: Usuario;
  data_emprestimo: string; // ISO
  data_devolucao_prevista: string; // ISO
  data_devolucao_real: string | null;
  status: StatusEmprestimo;
}

/* ---------- Página principal ---------- */

export default function EmprestimosPage() {
  const { user } = useAuth();
  const [filtro, setFiltro] = useState<StatusEmprestimo>("ativo");
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [novoOpen, setNovoOpen] = useState(false);
  const [devolucaoAlvo, setDevolucaoAlvo] = useState<Emprestimo | null>(null);
  const [detalhesAlvo, setDetalhesAlvo] = useState<any | null>(null);

  const isServidor = user?.tipo_usuario === "Servidor" || (user as any)?.is_superuser;

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const statusMap: Record<string, string> = {
        pendente: "Pendente",
        ativo: "Ativo",
        concluido: "Concluido",
        atrasado: "Atrasado",
        finalizado: "Finalizado",
        cancelado: "Finalizado"
      };
      const params = new URLSearchParams({ status: statusMap[filtro] || "Ativo" });
      if (buscaDebounced) params.set("search", buscaDebounced);
      const res = await api.get(`/emprestimos/?${params.toString()}`);
      const results = res.data.results || res.data;
      const formatted = (results || []).map((d: any) => ({
        id: d.id,
        ativo: {
          id: d.ativo_detail?.id || "",
          nome: d.ativo_detail?.nome || "",
          serial_patrimonio: d.ativo_detail?.serial_patrimonio || "",
          categoria: d.ativo_detail?.categoria === "TI" ? "TI" : d.ativo_detail?.categoria === "Mobiliário" ? "Mobilia" : d.ativo_detail?.categoria === "Veículo" ? "Veiculo" : "Outros",
          marca: d.ativo_detail?.marca || "",
          modelo: d.ativo_detail?.modelo || "",
          ram: d.ativo_detail?.especificacoes?.ram || "",
          armazenamento: d.ativo_detail?.especificacoes?.armazenamento || "",
          observacoes: d.ativo_detail?.observacoes || "",
          sala_detail: d.ativo_detail?.sala_detail || null
        },
        usuario: {
          id: d.usuario_detail?.id || "",
          nome: d.usuario_detail?.nome || "",
          matricula: d.usuario_detail?.matricula || "",
          email: d.usuario_detail?.email || "",
          tipo_usuario: d.usuario_detail?.tipo_usuario || "",
          aluno_detail: d.usuario_detail?.aluno_detail || null,
          servidor_detail: d.usuario_detail?.servidor_detail || null
        },
        autorizado_por: d.autorizado_por_detail || null,
        data_emprestimo: d.data_saida,
        data_devolucao_prevista: d.data_devolucao_prevista,
        data_devolucao_real: d.data_devolucao_real,
        status: d.status.toLowerCase() === "cancelado" ? "finalizado" : d.status.toLowerCase(),
        observacao_saida: d.observacao_saida || "",
        observacao_devolucao: d.observacao_devolucao || "",
        status_conservacao_retorno: d.status_conservacao_retorno || ""
      }));
      setEmprestimos(formatted);
    } catch {
      setEmprestimos([]);
      setErro("Não foi possível carregar os empréstimos.");
    } finally {
      setCarregando(false);
    }
  }, [filtro, buscaDebounced]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!sucesso) return;
    const t = setTimeout(() => setSucesso(null), 4000);
    return () => clearTimeout(t);
  }, [sucesso]);

  const handleAprovar = async (id: string) => {
    if (!window.confirm("Deseja realmente aprovar esta solicitação de empréstimo?")) return;
    try {
      await api.post(`/emprestimos/${id}/aprovar/`);
      setSucesso("Empréstimo aprovado e ativado com sucesso!");
      carregar();
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao aprovar solicitação.");
    }
  };

  const handleRejeitar = async (id: string) => {
    const motivo = window.prompt("Informe o motivo da rejeição da solicitação:");
    if (motivo === null) return;
    try {
      await api.post(`/emprestimos/${id}/rejeitar/`, { motivo: motivo || "Não especificado" });
      setSucesso("Solicitação de empréstimo rejeitada.");
      carregar();
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao rejeitar solicitação.");
    }
  };

  // Reclassificar status client-side comparando com hoje (exceto finalizados/pendentes)
  const listaFinal = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return emprestimos.map((e) => {
      if (e.status === "pendente") return { ...e, status: "pendente" as const };
      if (e.status === "finalizado") return { ...e, status: "finalizado" as const };
      if (e.data_devolucao_real) return { ...e, status: "concluido" as const };
      const prev = new Date(e.data_devolucao_prevista);
      prev.setHours(0, 0, 0, 0);
      if (prev.getTime() < hoje.getTime()) return { ...e, status: "atrasado" as const };
      return { ...e, status: "ativo" as const };
    });
  }, [emprestimos]);

  const contagem = useMemo(() => {
    const c = { pendente: 0, ativo: 0, concluido: 0, atrasado: 0, finalizado: 0 };
    for (const e of listaFinal) {
      if (c[e.status] !== undefined) c[e.status]++;
    }
    return c;
  }, [listaFinal]);

  return (
    <Layout>
      <div>
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">Empréstimos</h1>
            <p className="text-sm text-slate-600 mt-1">
              Solicite, acompanhe e registre devoluções de ativos patrimoniais.
            </p>
          </div>
          {isServidor && (
            <button
              type="button"
              onClick={() => setNovoOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-3 px-5 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo empréstimo
            </button>
          )}
        </header>

        {/* Filtros + busca */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-4 flex flex-col md:flex-row md:items-center gap-4">
          <div
            role="tablist"
            aria-label="Filtrar empréstimos"
            className="inline-flex flex-wrap gap-2"
          >
            <FilterPill
              active={filtro === "pendente"}
              onClick={() => setFiltro("pendente")}
              label="Pendentes"
              count={filtro === "pendente" ? contagem.pendente : undefined}
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />
            <FilterPill
              active={filtro === "ativo"}
              onClick={() => setFiltro("ativo")}
              label="Ativos"
              count={filtro === "ativo" ? contagem.ativo : undefined}
              icon={<Clock className="w-4 h-4 text-blue-500" />}
            />
            <FilterPill
              active={filtro === "atrasado"}
              onClick={() => setFiltro("atrasado")}
              label="Atrasados"
              count={filtro === "atrasado" ? contagem.atrasado : undefined}
              icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
            />
            <FilterPill
              active={filtro === "concluido"}
              onClick={() => setFiltro("concluido")}
              label="Concluídos"
              count={filtro === "concluido" ? contagem.concluido : undefined}
              icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            />
          </div>

          <div className="relative flex-1 md:max-w-sm md:ml-auto">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por ativo ou usuário..."
              aria-label="Buscar empréstimos"
              className="w-full py-3 pl-9 pr-3 rounded-md border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Banners */}
        {sucesso && (
          <StatusBanner kind="success" message={sucesso} onClose={() => setSucesso(null)} />
        )}
        {erro && <StatusBanner kind="error" message={erro} onClose={() => setErro(null)} />}

        {/* Conteúdo */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {carregando ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Carregando empréstimos...</span>
            </div>
          ) : listaFinal.length === 0 ? (
            <EmptyState filtro={filtro} />
          ) : (
            <>
              {/* Tabela — md+ */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-semibold py-3 px-4">Ativo</th>
                      <th className="text-left font-semibold py-3 px-4">Usuário</th>
                      <th className="text-left font-semibold py-3 px-4">Empréstimo</th>
                      <th className="text-left font-semibold py-3 px-4">Devolução prevista</th>
                      <th className="text-left font-semibold py-3 px-4">Status</th>
                      <th className="text-right font-semibold py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listaFinal.map((e) => (
                      <tr key={e.id} onClick={() => setDetalhesAlvo(e)} className="hover:bg-slate-50/60 cursor-pointer">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <CategoriaIcon categoria={e.ativo.categoria} />
                            <div>
                              <div className="font-medium text-slate-800">{e.ativo.nome}</div>
                              <div className="text-xs text-slate-500">
                                {labelCategoria(e.ativo.categoria)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{e.usuario.nome}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {formatarData(e.data_emprestimo)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {formatarData(e.data_devolucao_prevista)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {e.status === "pendente" ? (
                            isServidor ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(ev) => { ev.stopPropagation(); handleAprovar(e.id); }}
                                  className="inline-flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white font-semibold text-xs px-2.5 py-1.5 rounded cursor-pointer"
                                >
                                  Aprovar
                                </button>
                                <button
                                  type="button"
                                  onClick={(ev) => { ev.stopPropagation(); handleRejeitar(e.id); }}
                                  className="inline-flex items-center gap-1 bg-red-650 hover:bg-red-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded cursor-pointer"
                                >
                                  Rejeitar
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-100">
                                Pendente
                              </span>
                            )
                          ) : e.status === "finalizado" ? (
                            <span className="text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded border border-red-100">
                              Rejeitado
                            </span>
                          ) : e.status !== "concluido" ? (
                            isServidor ? (
                              <button
                                type="button"
                                onClick={(ev) => { ev.stopPropagation(); setDevolucaoAlvo(e); }}
                                className="inline-flex items-center gap-1.5 text-blue-900 hover:text-blue-950 font-semibold text-sm px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Devolver
                              </button>
                            ) : (
                              <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                                Em Uso
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards — mobile */}
              <ul className="md:hidden divide-y divide-slate-100">
                {listaFinal.map((e) => (
                  <li key={e.id} onClick={() => setDetalhesAlvo(e)} className="p-4 flex flex-col gap-3 hover:bg-slate-50/60 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <CategoriaIcon categoria={e.ativo.categoria} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {e.ativo.nome}
                        </div>
                        <div className="text-xs text-slate-500">
                          {labelCategoria(e.ativo.categoria)}
                        </div>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <dt className="text-slate-400">Usuário</dt>
                        <dd className="text-slate-800">{e.usuario.nome}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Empréstimo</dt>
                        <dd>{formatarData(e.data_emprestimo)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Devolução prevista</dt>
                        <dd>{formatarData(e.data_devolucao_prevista)}</dd>
                      </div>
                    </dl>

                    {e.status === "pendente" ? (
                      isServidor ? (
                        <div className="flex gap-2 w-full mt-2">
                          <button
                            type="button"
                            onClick={(ev) => { ev.stopPropagation(); handleAprovar(e.id); }}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-3 rounded text-xs cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={(ev) => { ev.stopPropagation(); handleRejeitar(e.id); }}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-red-650 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded text-xs cursor-pointer"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-center w-full text-xs text-amber-600 font-semibold bg-amber-50 py-2 rounded block border border-amber-100">
                          Aguardando Aprovação
                        </span>
                      )
                    ) : e.status === "finalizado" ? (
                      <span className="text-center w-full text-xs text-red-600 font-semibold bg-red-50 py-2 rounded block border border-red-100">
                        Solicitação Rejeitada
                      </span>
                    ) : e.status !== "concluido" ? (
                      isServidor && (
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); setDevolucaoAlvo(e); }}
                          className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-4 rounded-md text-sm cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Devolver
                        </button>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {novoOpen && (
        <FormularioSolicitacaoEmprestimo
          onClose={() => setNovoOpen(false)}
          onSucesso={() => {
            setNovoOpen(false);
            setSucesso("Empréstimo registrado com sucesso.");
            carregar();
          }}
        />
      )}
      {devolucaoAlvo && (
        <ModalDevolucaoAtivo
          emprestimo={devolucaoAlvo}
          onClose={() => setDevolucaoAlvo(null)}
          onSucesso={() => {
            setDevolucaoAlvo(null);
            setSucesso("Devolução registrada com sucesso.");
            carregar();
          }}
        />
      )}
      {detalhesAlvo && (
        <ModalDetalhesEmprestimo
          emprestimo={detalhesAlvo}
          onClose={() => setDetalhesAlvo(null)}
          isServidor={isServidor}
          onAprovar={(id) => {
            setDetalhesAlvo(null);
            handleAprovar(id);
          }}
          onRejeitar={(id) => {
            setDetalhesAlvo(null);
            handleRejeitar(id);
          }}
          onDevolver={(emp) => {
            setDetalhesAlvo(null);
            setDevolucaoAlvo(emp);
          }}
        />
      )}
    </Layout>
  );
}

/* ---------- Componentes de listagem ---------- */

function FilterPill({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-blue-900 text-white border-blue-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
      {typeof count === "number" && (
        <span
          className={`ml-1 min-w-[1.25rem] text-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: StatusEmprestimo }) {
  const map: Record<StatusEmprestimo, { label: string; cls: string; icon: ReactNode }> = {
    pendente: {
      label: "Pendente",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      icon: <Clock className="w-3 h-3 text-amber-500" />,
    },
    ativo: {
      label: "Ativo",
      cls: "bg-blue-50 text-blue-800 border-blue-200",
      icon: <Clock className="w-3 h-3 text-blue-500" />,
    },
    concluido: {
      label: "Concluído",
      cls: "bg-green-50 text-green-800 border-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    atrasado: {
      label: "Atrasado",
      cls: "bg-red-50 text-red-800 border-red-200",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    finalizado: {
      label: "Finalizado / Rejeitado",
      cls: "bg-zinc-100 text-zinc-700 border-zinc-300",
      icon: <X className="w-3 h-3 text-zinc-550" />,
    },
  };
  const s = map[status] || { label: status, cls: "bg-zinc-50 text-zinc-800 border-zinc-200", icon: null };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function CategoriaIcon({ categoria }: { categoria: Categoria }) {
  const map: Record<Categoria, ReactNode> = {
    Mobilia: <Sofa className="w-4 h-4 text-blue-800" />,
    TI: <Monitor className="w-4 h-4 text-blue-800" />,
    Veiculo: <Car className="w-4 h-4 text-blue-800" />,
    Outros: <Boxes className="w-4 h-4 text-blue-800" />,
  };
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-blue-50 border border-blue-100 shrink-0">
      {map[categoria] ?? <Package className="w-4 h-4 text-blue-800" />}
    </span>
  );
}

function EmptyState({ filtro }: { filtro: StatusEmprestimo }) {
  const label =
    filtro === "ativo"
      ? "Nenhum empréstimo ativo no momento."
      : filtro === "atrasado"
        ? "Nenhum empréstimo atrasado."
        : "Nenhum empréstimo concluído.";
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-slate-500 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Filter className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function StatusBanner({
  kind,
  message,
  onClose,
}: {
  kind: "success" | "error";
  message: string;
  onClose?: () => void;
}) {
  const isSuccess = kind === "success";
  return (
    <div
      role="status"
      className={`flex items-start gap-2 px-4 py-3 rounded-md border text-sm mb-4 ${
        isSuccess
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar mensagem"
          className="text-current/70 hover:opacity-70"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ---------- Modal base ---------- */

function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const focusables = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    // Foco inicial
    setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>(
        'input, select, textarea, button:not([aria-label="Fechar modal"])',
      );
      el?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-2 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={ref}
        className={`bg-white rounded-t-xl sm:rounded-xl border border-slate-200 w-full ${maxWidth} max-h-[95vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-blue-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Formulário de solicitação ---------- */

function FormularioSolicitacaoEmprestimo({
  onClose,
  onSucesso,
}: {
  onClose: () => void;
  onSucesso: () => void;
}) {
  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [data, setData] = useState("");
  const [errors, setErrors] = useState<{
    ativo?: string;
    usuario?: string;
    data?: string;
    geral?: string;
  }>({});
  const [enviando, setEnviando] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!ativo) next.ativo = "Selecione um ativo disponível.";
    if (!usuario) next.usuario = "Selecione o responsável.";
    if (!data) next.data = "Informe a data de devolução prevista.";
    else if (data < hoje) next.data = "A data não pode estar no passado.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setEnviando(true);
    try {
      const res = await api.post("/emprestimos/", {
        ativo: ativo!.id,
        usuario: usuario!.id,
        data_devolucao_prevista: data,
      });
      onSucesso();
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 400) {
        setErrors({
          ativo: err.response?.data?.detail || "Este ativo deixou de estar disponível. Selecione outro ativo para continuar.",
        });
        setAtivo(null);
      } else {
        setErrors({ geral: err.response?.data?.detail || "Erro ao registrar o empréstimo. Tente novamente." });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal title="Novo empréstimo" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AutocompleteAtivo
          selecionado={ativo}
          onChange={(a) => {
            setAtivo(a);
            setErrors((p) => ({ ...p, ativo: undefined }));
          }}
          error={errors.ativo}
        />
        <AutocompleteUsuario
          selecionado={usuario}
          onChange={(u) => {
            setUsuario(u);
            setErrors((p) => ({ ...p, usuario: undefined }));
          }}
          error={errors.usuario}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="data-devolucao" className="text-sm font-medium text-slate-700">
            Data de devolução prevista
          </label>
          <div className="relative">
            <Calendar
              className="w-4 h-4 text-blue-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="data-devolucao"
              type="date"
              min={hoje}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                setErrors((p) => ({ ...p, data: undefined }));
              }}
              className={`w-full py-3 pl-9 pr-3 rounded-md border bg-white text-slate-800 outline-none focus:ring-2 ${
                errors.data
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
              aria-invalid={!!errors.data}
            />
          </div>
          {errors.data && <FieldError message={errors.data} />}
        </div>

        {errors.geral && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {errors.geral}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-md bg-blue-900 hover:bg-blue-950 disabled:opacity-70 text-white font-semibold"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Confirmar empréstimo"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Autocompletes ---------- */

function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function AutocompleteAtivo({
  selecionado,
  onChange,
  error,
}: {
  selecionado: Ativo | null;
  onChange: (a: Ativo | null) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const [opcoes, setOpcoes] = useState<Ativo[]>([]);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selecionado) return;
    if (!debounced) {
      setOpcoes([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(
          `/ativos/?status=Disponivel&elegivel_emprestimo=true&search=${encodeURIComponent(debounced)}`
        );
        const results = res.data.results || res.data;
        const mapped = (results || []).map((d: any) => ({
          id: d.id,
          nome: d.nome,
          categoria: d.categoria === "TI" ? "TI" : d.categoria === "Mobiliário" ? "Mobilia" : d.categoria === "Veículo" ? "Veiculo" : "Outros"
        }));
        if (!cancel) setOpcoes(mapped);
      } catch {
        if (!cancel) setOpcoes([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [debounced, selecionado]);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Ativo</span>
        <div className="flex items-center gap-3 p-3 rounded-md border border-blue-200 bg-blue-50/50">
          <CategoriaIcon categoria={selecionado.categoria} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800 truncate">{selecionado.nome}</div>
            <div className="text-xs text-slate-500">
              {labelCategoria(selecionado.categoria)}
              {selecionado.marca ? ` · ${selecionado.marca}` : ""}
              {selecionado.ram ? ` · ${selecionado.ram}` : ""}
              {selecionado.armazenamento ? ` · ${selecionado.armazenamento}` : ""}
            </div>
          </div>
          <button
            type="button"
            aria-label="Trocar ativo selecionado"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label htmlFor="busca-ativo" className="text-sm font-medium text-slate-700">
        Ativo elegível
      </label>
      <div className="relative">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id="busca-ativo"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          placeholder="Buscar ativo disponível..."
          className={`w-full py-3 pl-9 pr-3 rounded-md border bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
          }`}
          autoComplete="off"
          aria-invalid={!!error}
        />
      </div>
      {aberto && debounced && (
        <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
            </div>
          ) : opcoes.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">Nenhum ativo disponível.</div>
          ) : (
            <ul>
              {opcoes.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o);
                      setAberto(false);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-50"
                  >
                    <CategoriaIcon categoria={o.categoria} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{o.nome}</div>
                      <div className="text-xs text-slate-500">{labelCategoria(o.categoria)}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Disponível
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <FieldError message={error} />}
    </div>
  );
}

function AutocompleteUsuario({
  selecionado,
  onChange,
  error,
}: {
  selecionado: Usuario | null;
  onChange: (u: Usuario | null) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const [opcoes, setOpcoes] = useState<Usuario[]>([]);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selecionado) return;
    if (!debounced) {
      setOpcoes([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`/usuarios/?search=${encodeURIComponent(debounced)}`);
        const results = res.data.results || res.data;
        const mapped = (results || []).map((d: any) => ({
          id: d.id,
          nome: d.nome
        }));
        if (!cancel) setOpcoes(mapped);
      } catch {
        if (!cancel) setOpcoes([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [debounced, selecionado]);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Responsável</span>
        <div className="flex items-center gap-3 p-3 rounded-md border border-blue-200 bg-blue-50/50">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
            {selecionado.nome.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800 truncate">{selecionado.nome}</div>
            {(selecionado.setor || selecionado.matricula) && (
              <div className="text-xs text-slate-500">
                {[selecionado.setor, selecionado.matricula].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Trocar responsável selecionado"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label htmlFor="busca-usuario" className="text-sm font-medium text-slate-700">
        Responsável pelo empréstimo
      </label>
      <div className="relative">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id="busca-usuario"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          placeholder="Buscar usuário..."
          className={`w-full py-3 pl-9 pr-3 rounded-md border bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
          }`}
          autoComplete="off"
          aria-invalid={!!error}
        />
      </div>
      {aberto && debounced && (
        <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
            </div>
          ) : opcoes.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">Nenhum usuário encontrado.</div>
          ) : (
            <ul>
              {opcoes.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o);
                      setAberto(false);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-slate-50"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                      {o.nome.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{o.nome}</div>
                      {(o.setor || o.matricula) && (
                        <div className="text-xs text-slate-500">
                          {[o.setor, o.matricula].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <FieldError message={error} />}
    </div>
  );
}

/* ---------- Modal de devolução ---------- */

function ModalDevolucaoAtivo({
  emprestimo,
  onClose,
  onSucesso,
}: {
  emprestimo: Emprestimo;
  onClose: () => void;
  onSucesso: () => void;
}) {
  const [estado, setEstado] = useState<EstadoAtivo | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const diasAtraso = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prev = new Date(emprestimo.data_devolucao_prevista);
    prev.setHours(0, 0, 0, 0);
    const diff = Math.floor((hoje.getTime() - prev.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [emprestimo.data_devolucao_prevista]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estado) {
      setErroCampo("Selecione o estado do ativo.");
      return;
    }
    setEnviando(true);
    setErroGeral(null);
    try {
      const res = await api.post(`/emprestimos/${emprestimo.id}/devolver/`, {
        status_conservacao: estado,
        observacao_devolucao: observacoes.trim() || undefined,
      });
      onSucesso();
    } catch {
      setErroGeral("Não foi possível registrar a devolução. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const placeholderObs =
    estado === "Regular" || estado === "Danificado"
      ? "Descreva o dano encontrado..."
      : "Observações sobre o estado do ativo (opcional)";

  return (
    <Modal title="Registrar devolução" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {/* Resumo */}
        <div className="rounded-md bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
          <CategoriaIcon categoria={emprestimo.ativo.categoria} />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Ativo</div>
              <div className="font-semibold text-slate-800">{emprestimo.ativo.nome}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Usuário</div>
              <div className="font-medium text-slate-800">{emprestimo.usuario.nome}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Data do empréstimo</div>
              <div className="text-slate-700">{formatarData(emprestimo.data_emprestimo)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Devolução prevista</div>
              <div className="text-slate-700">
                {formatarData(emprestimo.data_devolucao_prevista)}
              </div>
            </div>
          </div>
        </div>

        {diasAtraso > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md border bg-orange-50 border-orange-200 text-orange-800 text-sm">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Devolução em atraso: <strong>{diasAtraso}</strong>{" "}
              {diasAtraso === 1 ? "dia" : "dias"} após o prazo previsto.
            </span>
          </div>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-700 mb-1">
            Estado do ativo na devolução
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <EstadoOpcao
              value="Excelente"
              current={estado}
              onSelect={(v) => {
                setEstado(v);
                setErroCampo(null);
              }}
              color="green"
              icon={<CheckCircle2 className="w-5 h-5" />}
            />
            <EstadoOpcao
              value="Bom"
              current={estado}
              onSelect={(v) => {
                setEstado(v);
                setErroCampo(null);
              }}
              color="blue"
              icon={<ThumbsUp className="w-5 h-5" />}
            />
            <EstadoOpcao
              value="Regular"
              current={estado}
              onSelect={(v) => {
                setEstado(v);
                setErroCampo(null);
              }}
              color="amber"
              icon={<Smile className="w-5 h-5" />}
            />
            <EstadoOpcao
              value="Danificado"
              current={estado}
              onSelect={(v) => {
                setEstado(v);
                setErroCampo(null);
              }}
              color="red"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
          </div>
          {erroCampo && <FieldError message={erroCampo} />}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="obs" className="text-sm font-medium text-slate-700">
            Observações {estado === "Danificado" ? "" : "(opcional)"}
          </label>
          <textarea
            id="obs"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder={placeholderObs}
            rows={3}
            className="w-full py-3 px-4 rounded-md border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
          />
        </div>

        {erroGeral && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {erroGeral}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-md bg-blue-900 hover:bg-blue-950 disabled:opacity-70 text-white font-semibold"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Confirmar devolução"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EstadoOpcao({
  value,
  current,
  onSelect,
  color,
  icon,
}: {
  value: EstadoAtivo;
  current: EstadoAtivo | null;
  onSelect: (v: EstadoAtivo) => void;
  color: "green" | "blue" | "amber" | "red";
  icon: ReactNode;
}) {
  const active = current === value;
  const palette: Record<typeof color, { border: string; bg: string; text: string }> = {
    green: {
      border: "border-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
    },
    blue: {
      border: "border-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    amber: {
      border: "border-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    red: {
      border: "border-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
    },
  };
  const p = palette[color];
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-md border-2 transition-colors text-sm font-medium ${
        active
          ? `${p.border} ${p.bg} ${p.text}`
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span className={active ? p.text : "text-slate-400"}>{icon}</span>
      {value}
    </button>
  );
}

/* ---------- Helpers ---------- */

function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
      <AlertCircle className="w-3.5 h-3.5" />
      {message}
    </p>
  );
}

function formatarData(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function labelCategoria(c: Categoria) {
  return c === "Mobilia" ? "Mobília" : c === "Veiculo" ? "Veículo" : c;
}

/* ---------- Modal de Detalhes do Empréstimo ---------- */

interface ModalDetalhesEmprestimoProps {
  emprestimo: any;
  onClose: () => void;
  isServidor: boolean;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onDevolver: (emprestimo: any) => void;
}

function ModalDetalhesEmprestimo({
  emprestimo,
  onClose,
  isServidor,
  onAprovar,
  onRejeitar,
  onDevolver
}: ModalDetalhesEmprestimoProps) {
  const u = emprestimo.usuario;
  const a = emprestimo.ativo;
  const aut = emprestimo.autorizado_por;
  
  const isAluno = u.tipo_usuario === "Aluno";
  const isUserServidor = u.tipo_usuario === "Servidor";
  const isUserProfessor = u.tipo_usuario === "Professor";

  const alunoCurso = u.aluno_detail?.curso_detail?.nome || "";
  const alunoCursoSigla = u.aluno_detail?.curso_detail?.sigla || "";
  const alunoCampus = u.aluno_detail?.curso_detail?.campus_detail?.nome || "";
  const alunoCampusSigla = u.aluno_detail?.curso_detail?.campus_detail?.sigla || "";
  const alunoEscola = u.aluno_detail?.curso_detail?.escola_detail?.nome || "";
  const alunoEscolaSigla = u.aluno_detail?.curso_detail?.escola_detail?.sigla || "";

  return (
    <Modal title="Detalhes do Empréstimo" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-6 text-sm text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
        {/* Seção 1: Status Geral */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ID da Transação</span>
            <span className="font-mono text-slate-800 font-semibold">#{emprestimo.id}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status Atual</span>
            <StatusBadge status={emprestimo.status} />
          </div>
        </div>

        {/* Seção 2: O Ativo */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4" />
            Informações do Ativo Patrimonial
          </h4>
          <div className="flex items-start gap-4">
            <CategoriaIcon categoria={a.categoria} />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400 block">Nome do Ativo</span>
                <span className="font-semibold text-slate-800">{a.nome || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Patrimônio / Tombamento</span>
                <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">{a.serial_patrimonio || "Sem Tombamento"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Marca / Modelo</span>
                <span className="font-medium text-slate-700">{a.marca || "—"} {a.modelo ? `/ ${a.modelo}` : ""}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Especificações Técnicas</span>
                <span className="font-medium text-slate-700">
                  {a.ram ? `RAM: ${a.ram}` : ""} {a.armazenamento ? `| Armazenamento: ${a.armazenamento}` : ""} {!a.ram && !a.armazenamento ? "Não especificadas" : ""}
                </span>
              </div>
              {a.sala_detail && (
                <div className="sm:col-span-2 bg-slate-50 p-2 rounded border border-slate-150 text-xs">
                  <span className="text-slate-400 font-bold block mb-0.5">Localização de Origem Fixa:</span>
                  <span className="text-blue-950 font-semibold">{a.sala_detail.tipo} {a.sala_detail.numero} — Campus {a.sala_detail.campus_detail?.nome || a.sala_detail.campus}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção 3: O Beneficiário */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <User className="w-4 h-4" />
            Dados do Solicitante / Beneficiário
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Nome Completo</span>
              <span className="font-semibold text-slate-800">{u.nome || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Tipo de Usuário</span>
              <span className="font-semibold text-blue-900 uppercase text-xs tracking-wider">{u.tipo_usuario || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Matrícula</span>
              <span className="font-mono text-slate-800 font-semibold">{u.matricula || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">E-mail de Contato</span>
              <span className="font-medium text-slate-700">{u.email || "—"}</span>
            </div>

            {/* Campos Específicos para Aluno */}
            {isAluno && (
              <>
                <div className="sm:col-span-2 border-t border-slate-100 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-slate-400 block">Curso</span>
                    <span className="font-semibold text-slate-800" title={alunoCurso}>{alunoCursoSigla || alunoCurso || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Escola Superior</span>
                    <span className="font-semibold text-slate-800" title={alunoEscola}>{alunoEscolaSigla || alunoEscola || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Campus</span>
                    <span className="font-semibold text-slate-800" title={alunoCampus}>{alunoCampusSigla || alunoCampus || "—"}</span>
                  </div>
                </div>
              </>
            )}

            {/* Campos Específicos para Servidor */}
            {isUserServidor && u.servidor_detail && (
              <div className="sm:col-span-2 border-t border-slate-100 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-400 block">Cargo</span>
                  <span className="font-semibold text-slate-800">{u.servidor_detail.cargo || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Setor Alocado</span>
                  <span className="font-semibold text-slate-800">{u.servidor_detail.setor_detail?.nome || u.servidor_detail.setor || "—"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção 4: Movimentações e Datas */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4" />
            Cronograma e Prazos do Empréstimo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Data de Saída</span>
              <span className="font-semibold text-slate-800">{formatarData(emprestimo.data_emprestimo)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Devolução Prevista</span>
              <span className="font-semibold text-slate-800">{formatarData(emprestimo.data_devolucao_prevista)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Devolução Realizada</span>
              <span className="font-semibold text-green-700">{formatarData(emprestimo.data_devolucao_real) || <span className="text-slate-400 italic">Pendente</span>}</span>
            </div>
            {emprestimo.status_conservacao_retorno && (
              <div>
                <span className="text-xs text-slate-400 block">Conservação no Retorno</span>
                <span className="font-semibold text-slate-800">{emprestimo.status_conservacao_retorno}</span>
              </div>
            )}
            {emprestimo.observacao_saida && (
              <div className="sm:col-span-3 bg-slate-50 p-2 rounded border border-slate-150 text-xs">
                <span className="text-slate-400 font-bold block mb-0.5">Observação na Retirada:</span>
                <span className="text-slate-700">{emprestimo.observacao_saida}</span>
              </div>
            )}
            {emprestimo.observacao_devolucao && (
              <div className="sm:col-span-3 bg-red-50/50 p-2 rounded border border-red-100 text-xs">
                <span className="text-red-700 font-bold block mb-0.5">Observação na Devolução / Rejeição:</span>
                <span className="text-slate-700">{emprestimo.observacao_devolucao}</span>
              </div>
            )}
          </div>
        </div>

        {/* Seção 5: Autorização */}
        {aut && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              Autorizador do Empréstimo
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Servidor Responsável</span>
                <span className="font-semibold text-slate-800">{aut.usuario?.nome || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Cargo / Setor</span>
                <span className="font-medium text-slate-700">{aut.cargo} ({aut.setor_detail?.nome || aut.setor})</span>
              </div>
            </div>
          </div>
        )}

        {/* Seção 6: Rodapé com ações */}
        <div className="pt-4 flex flex-col sm:flex-row sm:justify-between items-center gap-3 border-t border-slate-100 mt-6">
          <div className="flex gap-2 w-full sm:w-auto">
            {emprestimo.status === "pendente" && isServidor && (
              <>
                <button
                  type="button"
                  onClick={() => onAprovar(emprestimo.id)}
                  className="flex-1 sm:flex-initial bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm cursor-pointer transition-colors shadow-sm"
                >
                  Aprovar Empréstimo
                </button>
                <button
                  type="button"
                  onClick={() => onRejeitar(emprestimo.id)}
                  className="flex-1 sm:flex-initial bg-red-650 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm cursor-pointer transition-colors shadow-sm"
                >
                  Rejeitar
                </button>
              </>
            )}

            {(emprestimo.status === "ativo" || emprestimo.status === "atrasado") && isServidor && (
              <button
                type="button"
                onClick={() => onDevolver(emprestimo)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 px-5 rounded-lg text-sm cursor-pointer transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Registrar Devolução
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 rounded-lg text-slate-650 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </Modal>
  );
}
