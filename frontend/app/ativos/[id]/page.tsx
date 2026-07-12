"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/useAuth";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  Package,
  Calendar,
  User,
  MapPin,
  Cpu,
  HardDrive,
  Monitor,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Info,
  Check
} from "lucide-react";

export default function AtivoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id;

  const [ativo, setAtivo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de solicitação
  const [modalOpen, setModalOpen] = useState(false);
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [solicitacaoErro, setSolicitacaoErro] = useState<string | null>(null);
  const [solicitacaoSucesso, setSolicitacaoSucesso] = useState(false);
  const [filaLoading, setFilaLoading] = useState(false);

  const handleEntrarFila = async () => {
    setFilaLoading(true);
    try {
      const response = await api.post(`/ativos/${id}/entrar-fila/`);
      setAtivo(response.data.ativo);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao entrar na fila.");
    } finally {
      setFilaLoading(false);
    }
  };

  const handleSairFila = async () => {
    setFilaLoading(true);
    try {
      const response = await api.post(`/ativos/${id}/sair-fila/`);
      setAtivo(response.data.ativo);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao sair da fila.");
    } finally {
      setFilaLoading(false);
    }
  };

  const buscarAtivo = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/ativos/${id}/`);
      setAtivo(response.data);
    } catch (err: any) {
      console.error("Erro ao buscar ativo:", err);
      setError("Não foi possível carregar as informações deste ativo.");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    buscarAtivo().finally(() => setLoading(false));
  }, [buscarAtivo]);

  useAutoRefresh(buscarAtivo, 60000);

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataDevolucao) return;

    setSubmitting(true);
    setSolicitacaoErro(null);

    try {
      // Cria a solicitação
      await api.post("/emprestimos/", {
        ativo: parseInt(id as string),
        data_devolucao_prevista: new Date(dataDevolucao).toISOString(),
        observacao_saida: observacao.trim() || undefined
      });

      setSolicitacaoSucesso(true);
      setTimeout(() => {
        setModalOpen(false);
        setSolicitacaoSucesso(false);
        setDataDevolucao("");
        setObservacao("");
        router.push("/emprestimos");
      }, 2500);
    } catch (err: any) {
      console.error("Erro ao solicitar empréstimo:", err);
      setSolicitacaoErro(
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        "Falha ao realizar a solicitação. Verifique se possui atividade acadêmica ativa ou se o item já está reservado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-10 h-10 animate-spin text-blue-900 mb-3" />
          <p className="text-sm">Buscando informações do ativo...</p>
        </div>
      </Layout>
    );
  }

  if (error || !ativo) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">{error || "Ativo não localizado no sistema."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tiProfile = ativo.ti_profile;
  const isTI = ativo.categoria?.toLowerCase() === "ti" && tiProfile;
  const elegivel = ativo.elegivel_emprestimo;
  const disponivel = !ativo.emprestado && ativo.status === "Novo";
  const podeSolicitar = user?.tipo_usuario !== "Servidor" && elegivel && disponivel;

  const fallbackImg = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb e Ação de Voltar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Catálogo
          </button>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-full font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tempo Real (60s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Coluna 1: Imagem */}
          <div className="relative bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center min-h-[300px] md:min-h-[450px]">
            <img
              src={ativo.imagem_url || fallbackImg}
              alt={ativo.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = fallbackImg;
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                ativo.emprestado
                  ? "bg-amber-100 text-amber-800"
                  : ativo.status === "Novo"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {ativo.emprestado ? "Emprestado" : ativo.status}
              </span>
              <span className="bg-zinc-900/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm">
                {ativo.categoria}
              </span>
            </div>
          </div>

          {/* Coluna 2: Detalhes do Ativo */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                  Patrimônio: {ativo.serial_patrimonio}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {ativo.nome}
                </h1>
                {ativo.emprestado && ativo.devolucao_prevista && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Previsão de Devolução: {new Date(ativo.devolucao_prevista).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              {ativo.descricao && (
                <div className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-l-2 border-zinc-200 dark:border-zinc-700 pl-4 py-1">
                  {ativo.descricao}
                </div>
              )}

              {/* Especificações de TI */}
              {isTI && (
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                    <Cpu className="w-4 h-4 text-blue-900" />
                    Especificações do Computador
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-zinc-400 text-xs block">Marca</span>
                      <span className="font-semibold">{tiProfile.marca}</span>
                    </div>
                    {tiProfile.sistema_operacional && (
                      <div>
                        <span className="text-zinc-400 text-xs block">Sistema Operacional</span>
                        <span className="font-semibold">{tiProfile.sistema_operacional}</span>
                      </div>
                    )}
                    {tiProfile.memoria_ram_gb && (
                      <div>
                        <span className="text-zinc-400 text-xs block">Memória RAM</span>
                        <span className="font-semibold">{tiProfile.memoria_ram_gb} GB</span>
                      </div>
                    )}
                    {tiProfile.armazenamento_gb && (
                      <div>
                        <span className="text-zinc-400 text-xs block">Armazenamento</span>
                        <span className="font-semibold">{tiProfile.armazenamento_gb} GB</span>
                      </div>
                    )}
                    {tiProfile.sala_detail && (
                      <div className="col-span-2 flex items-start gap-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-2 mt-1">
                        <MapPin className="w-4 h-4 text-blue-800 mt-0.5" />
                        <div>
                          <span className="text-zinc-400 text-xs block">Local Fixo / Sala</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-200">
                            {tiProfile.sala_detail.tipo} {tiProfile.sala_detail.numero} ({tiProfile.sala_detail.campus})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações Gerais (Setor e Responsável) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Setor de Origem</span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {ativo.setor_detail 
                        ? `${ativo.setor_detail.tipo} (${ativo.setor_detail.campus_detail?.sigla || ""})` 
                        : "Sem setor"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Responsável</span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {ativo.responsavel_detail?.usuario?.nome || "Sem responsável"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              {podeSolicitar ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-base"
                >
                  <Calendar className="w-5 h-5" />
                  Solicitar Empréstimo
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-4 flex gap-2">
                    <Info className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">Reserva indisponível para este item</p>
                      {!elegivel && <p>Este ativo não está catalogado como elegível para empréstimo estudantil.</p>}
                      {elegivel && !disponivel && (
                        <p>O ativo já se encontra emprestado ou indisponível no momento.</p>
                      )}
                      {user?.tipo_usuario === "Servidor" && (
                        <p>Como Servidor, você pode realizar saídas diretas desse item na tela de Empréstimos ou gerenciá-lo.</p>
                      )}
                    </div>
                  </div>

                  {/* Fila de Espera */}
                  {elegivel && ativo.emprestado && user?.tipo_usuario !== "Servidor" && (
                    <div className="mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-805/85 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <span>Fila de Espera:</span>
                        <span>{ativo.fila_espera_count || 0} na fila</span>
                      </div>
                      {ativo.usuario_na_fila_posicao ? (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-3 flex flex-col gap-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-400">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            <span>Você está na fila de espera (Posição: {ativo.usuario_na_fila_posicao})</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleSairFila}
                            disabled={filaLoading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                          >
                            {filaLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Sair da Fila de Espera
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleEntrarFila}
                          disabled={filaLoading}
                          className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-75"
                        >
                          {filaLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Entrar na Fila de Espera
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Solicitação de Empréstimo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-base">Solicitar Empréstimo</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl font-semibold outline-none"
              >
                &times;
              </button>
            </div>

            {solicitacaoSucesso ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Solicitação Registrada!</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Sua solicitação foi enviada para análise dos Servidores do Campus. Você será notificado assim que for aprovado.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSolicitar} className="p-6 space-y-4">
                {solicitacaoErro && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{solicitacaoErro}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Item Solicitado</label>
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/80 rounded-lg p-2 text-sm font-semibold">
                    {ativo.nome} ({ativo.serial_patrimonio})
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase block">Data de Devolução Desejada</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={dataDevolucao}
                    onChange={(e) => setDataDevolucao(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> O prazo máximo recomendado de devolução para alunos é de até 30 dias.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Observação / Justificativa</label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={3}
                    placeholder="Escreva uma justificativa breve (ex: PIBIC, TCC de TI)..."
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-75"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar Solicitação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
