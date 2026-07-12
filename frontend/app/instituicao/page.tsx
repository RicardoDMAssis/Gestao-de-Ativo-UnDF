"use client";

import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/useAuth";
import {
  Building2,
  MapPin,
  FolderTree,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  DoorOpen,
  Pencil
} from "lucide-react";

export default function InstituicaoPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"escolas" | "campi" | "setores" | "cursos" | "salas">("campi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data lists
  const [escolas, setEscolas] = useState<any[]>([]);
  const [campi, setCampi] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form inputs
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [cidade, setCidade] = useState("");
  const [email, setEmail] = useState("");
  const [setorTipo, setSetorTipo] = useState("Academico");
  
  // Sala inputs
  const [salaNumero, setSalaNumero] = useState("");
  const [salaTipo, setSalaTipo] = useState("Sala");
  
  // Relations selection
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [selectedEscolaId, setSelectedEscolaId] = useState("");

  const isServidor = user?.tipo_usuario === "Servidor" || !!user?.servidor_profile || (user as any)?.is_superuser;

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "escolas") {
        const res = await api.get("/escolas/");
        setEscolas(res.data.results || res.data || []);
      } else if (activeTab === "campi") {
        const res = await api.get("/campi/");
        setCampi(res.data.results || res.data || []);
      } else if (activeTab === "setores") {
        const [resSetores, resCampi] = await Promise.all([
          api.get("/setores/"),
          api.get("/campi/")
        ]);
        setSetores(resSetores.data.results || resSetores.data || []);
        setCampi(resCampi.data.results || resCampi.data || []);
      } else if (activeTab === "cursos") {
        const [resCursos, resEscolas, resCampi] = await Promise.all([
          api.get("/cursos/"),
          api.get("/escolas/"),
          api.get("/campi/")
        ]);
        setCursos(resCursos.data.results || resCursos.data || []);
        setEscolas(resEscolas.data.results || resEscolas.data || []);
        setCampi(resCampi.data.results || resCampi.data || []);
      } else if (activeTab === "salas") {
        const [resSalas, resCampi] = await Promise.all([
          api.get("/salas/"),
          api.get("/campi/")
        ]);
        setSalas(resSalas.data.results || resSalas.data || []);
        setCampi(resCampi.data.results || resCampi.data || []);
      }
    } catch (e: any) {
      setError("Não foi possível carregar os dados desta seção.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [activeTab]);

  const resetForm = () => {
    setEditingItem(null);
    setNome("");
    setSigla("");
    setCidade("");
    setEmail("");
    setSetorTipo("Academico");
    setSalaNumero("");
    setSalaTipo("Sala");
    setSelectedCampusId("");
    setSelectedEscolaId("");
    setFormError(null);
  };

  const handleEditar = (item: any) => {
    setEditingItem(item);
    setNome(item.nome || "");
    setSigla(item.sigla || "");
    setCidade(item.cidade || "");
    setEmail(item.email || "");
    setSetorTipo(item.tipo || "Academico");
    setSalaNumero(item.numero || "");
    setSalaTipo(item.tipo || "Sala");
    setSelectedCampusId(item.campus ? String(item.campus) : "");
    setSelectedEscolaId(item.escola ? String(item.escola) : "");
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    let payload: any = {};
    let endpoint = "";

    try {
      if (activeTab === "campi") {
        if (!nome.trim() || !sigla.trim() || !cidade.trim()) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        payload = { nome, sigla, cidade, ativo: true };
        endpoint = "/campi/";
      } else if (activeTab === "escolas") {
        if (!nome.trim() || !sigla.trim()) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        payload = { nome, sigla, ativo: true };
        endpoint = "/escolas/";
      } else if (activeTab === "setores") {
        if (!nome.trim() || !selectedCampusId || !setorTipo) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        payload = { 
          nome, 
          campus: parseInt(selectedCampusId), 
          tipo: setorTipo, 
          email: email.trim() || undefined,
          ativo: true 
        };
        endpoint = "/setores/";
      } else if (activeTab === "cursos") {
        if (!nome.trim() || !selectedEscolaId || !selectedCampusId) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        payload = { 
          nome, 
          sigla: sigla.trim() || undefined,
          escola: parseInt(selectedEscolaId),
          campus: parseInt(selectedCampusId),
          ativo: true 
        };
        endpoint = "/cursos/";
      } else if (activeTab === "salas") {
        if (!salaNumero.trim() || !selectedCampusId || !salaTipo) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        payload = {
          numero: salaNumero.trim(),
          tipo: salaTipo,
          campus: parseInt(selectedCampusId)
        };
        endpoint = "/salas/";
      }

      if (editingItem) {
        endpoint = `${endpoint}${editingItem.id}/`;
        await api.put(endpoint, payload);
      } else {
        await api.post(endpoint, payload);
      }

      setModalOpen(false);
      resetForm();
      carregarDados();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.message || "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    let endpoint = "";
    if (activeTab === "campi") endpoint = `/campi/${id}/`;
    else if (activeTab === "escolas") endpoint = `/escolas/${id}/`;
    else if (activeTab === "setores") endpoint = `/setores/${id}/`;
    else if (activeTab === "cursos") endpoint = `/cursos/${id}/`;
    else if (activeTab === "salas") endpoint = `/salas/${id}/`;

    if (!window.confirm("Deseja realmente remover este registro?")) return;
    try {
      await api.delete(endpoint);
      carregarDados();
    } catch {
      alert("Erro ao excluir. Verifique se existem dependências associadas.");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-900" />
              Estrutura Institucional UnDF
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Gerencie locais, salas de laboratório, campi, escolas superiores, setores e cursos da universidade.
            </p>
          </div>
          {isServidor && (
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar {activeTab === "salas" ? "Sala" : activeTab.slice(0, -1)}
            </button>
          )}
        </div>

        {/* Abas */}
        <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("campi")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "campi"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Campi
          </button>
          <button
            onClick={() => setActiveTab("escolas")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "escolas"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Escolas Superiores
          </button>
          <button
            onClick={() => setActiveTab("setores")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "setores"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Setores
          </button>
          <button
            onClick={() => setActiveTab("cursos")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "cursos"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Cursos
          </button>
          <button
            onClick={() => setActiveTab("salas")}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "salas"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            Salas & Laboratórios
          </button>
        </div>

        {/* Listagem */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm">Carregando informações...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-650 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={carregarDados}
                className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-md"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Tabela de Campi */}
              {activeTab === "campi" && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Nome</th>
                      <th className="py-3.5 px-6">Sigla</th>
                      <th className="py-3.5 px-6">Cidade</th>
                      <th className="py-3.5 px-6">Status</th>
                      {isServidor && <th className="py-3.5 px-6 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {campi.length === 0 ? (
                      <tr>
                        <td colSpan={isServidor ? 5 : 4} className="py-8 text-center text-slate-400">Nenhum campus cadastrado.</td>
                      </tr>
                    ) : (
                      campi.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-medium text-slate-900">{c.nome}</td>
                          <td className="py-4 px-6">{c.sigla}</td>
                          <td className="py-4 px-6">{c.cidade}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${c.ativo ? "bg-green-100 text-green-705" : "bg-red-100 text-red-705"}`}>
                              {c.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          {isServidor && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditar(c)} className="text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer" title="Editar">
                                  <Pencil className="w-4.5 h-4.5" />
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer" title="Excluir">
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tabela de Escolas */}
              {activeTab === "escolas" && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Nome</th>
                      <th className="py-3.5 px-6">Sigla</th>
                      <th className="py-3.5 px-6">Status</th>
                      {isServidor && <th className="py-3.5 px-6 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {escolas.length === 0 ? (
                      <tr>
                        <td colSpan={isServidor ? 4 : 3} className="py-8 text-center text-slate-400">Nenhuma escola cadastrada.</td>
                      </tr>
                    ) : (
                      escolas.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-medium text-slate-900">{e.nome}</td>
                          <td className="py-4 px-6">{e.sigla}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${e.ativo ? "bg-green-100 text-green-705" : "bg-red-100 text-red-705"}`}>
                              {e.ativo ? "Ativa" : "Inativa"}
                            </span>
                          </td>
                          {isServidor && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditar(e)} className="text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer" title="Editar">
                                  <Pencil className="w-4.5 h-4.5" />
                                </button>
                                <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer" title="Excluir">
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tabela de Setores */}
              {activeTab === "setores" && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Nome</th>
                      <th className="py-3.5 px-6">Tipo</th>
                      <th className="py-3.5 px-6">E-mail</th>
                      <th className="py-3.5 px-6">Campus</th>
                      {isServidor && <th className="py-3.5 px-6 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {setores.length === 0 ? (
                      <tr>
                        <td colSpan={isServidor ? 5 : 4} className="py-8 text-center text-slate-400">Nenhum setor cadastrado.</td>
                      </tr>
                    ) : (
                      setores.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-medium text-slate-900">{s.nome}</td>
                          <td className="py-4 px-6">{s.tipo}</td>
                          <td className="py-4 px-6">{s.email || "—"}</td>
                          <td className="py-4 px-6">{s.campus_detail?.nome || s.campus}</td>
                          {isServidor && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditar(s)} className="text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer" title="Editar">
                                  <Pencil className="w-4.5 h-4.5" />
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer" title="Excluir">
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tabela de Cursos */}
              {activeTab === "cursos" && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Nome</th>
                      <th className="py-3.5 px-6">Sigla</th>
                      <th className="py-3.5 px-6">Escola</th>
                      <th className="py-3.5 px-6">Campus</th>
                      {isServidor && <th className="py-3.5 px-6 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {cursos.length === 0 ? (
                      <tr>
                        <td colSpan={isServidor ? 5 : 4} className="py-8 text-center text-slate-400">Nenhum curso cadastrado.</td>
                      </tr>
                    ) : (
                      cursos.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-medium text-slate-900">{c.nome}</td>
                          <td className="py-4 px-6">{c.sigla || "—"}</td>
                          <td className="py-4 px-6">{c.escola_detail?.nome || c.escola}</td>
                          <td className="py-4 px-6">{c.campus_detail?.nome || c.campus}</td>
                          {isServidor && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditar(c)} className="text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer" title="Editar">
                                  <Pencil className="w-4.5 h-4.5" />
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer" title="Excluir">
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tabela de Salas & Laboratórios */}
              {activeTab === "salas" && (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Identificação / Número</th>
                      <th className="py-3.5 px-6">Tipo</th>
                      <th className="py-3.5 px-6">Campus</th>
                      {isServidor && <th className="py-3.5 px-6 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {salas.length === 0 ? (
                      <tr>
                        <td colSpan={isServidor ? 4 : 3} className="py-8 text-center text-slate-400">Nenhuma sala ou laboratório cadastrado.</td>
                      </tr>
                    ) : (
                      salas.map((sala) => (
                        <tr key={sala.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            {sala.tipo} {sala.numero}
                          </td>
                          <td className="py-4 px-6 font-medium text-blue-900">{sala.tipo}</td>
                          <td className="py-4 px-6">{sala.campus_detail?.nome || `Campus ${sala.campus}`}</td>
                          {isServidor && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditar(sala)} className="text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer" title="Editar">
                                  <Pencil className="w-4.5 h-4.5" />
                                </button>
                                <button onClick={() => handleDelete(sala.id)} className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer" title="Excluir">
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base capitalize">
                {editingItem ? "Editar " : "Adicionar "}
                {activeTab === "salas" ? "Sala / Laboratório" : activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-650 border border-red-200 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Se NÃO for sala, renderiza campo Nome Oficial */}
              {activeTab !== "salas" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nome Oficial</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
                    placeholder={`Ex: Campus Asa Norte`}
                  />
                </div>
              )}

              {/* Se for sala, renderiza inputs de Sala */}
              {activeTab === "salas" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Identificação / Número da Sala *</label>
                    <input
                      type="text"
                      required
                      value={salaNumero}
                      onChange={(e) => setSalaNumero(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                      placeholder="Ex: 102, Lab A, Auditório"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tipo de Sala *</label>
                    <select
                      value={salaTipo}
                      onChange={(e) => setSalaTipo(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                    >
                      <option value="Sala">Sala de Aula Comum</option>
                      <option value="Laboratorio">Laboratório de Informática / TI</option>
                    </select>
                  </div>
                </>
              )}

              {/* Condicionais por Aba */}
              {(activeTab === "campi" || activeTab === "escolas" || activeTab === "cursos") && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Sigla</label>
                  <input
                    type="text"
                    required={activeTab !== "cursos"}
                    value={sigla}
                    onChange={(e) => setSigla(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                    placeholder="Ex: EST"
                  />
                </div>
              )}

              {activeTab === "campi" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Cidade</label>
                  <input
                    type="text"
                    required
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                    placeholder="Ex: Brasília"
                  />
                </div>
              )}

              {activeTab === "setores" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tipo de Setor</label>
                    <select
                      value={setorTipo}
                      onChange={(e) => setSetorTipo(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                    >
                      <option value="Academico">Acadêmico</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">E-mail do Setor (Opcional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                      placeholder="Ex: ti@undf.edu.br"
                    />
                  </div>
                </>
              )}

              {/* Relações */}
              {activeTab === "cursos" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Escola Superior Vinculada</label>
                  <select
                    required
                    value={selectedEscolaId}
                    onChange={(e) => setSelectedEscolaId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                  >
                    <option value="">Selecione uma Escola...</option>
                    {escolas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {(activeTab === "setores" || activeTab === "cursos" || activeTab === "salas") && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Campus Alocado</label>
                  <select
                    required
                    value={selectedCampusId}
                    onChange={(e) => setSelectedCampusId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-slate-800"
                  >
                    <option value="">Selecione um Campus...</option>
                    {campi.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Salvar Alterações" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
