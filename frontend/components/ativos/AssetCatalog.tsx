"use client";

import React, { useState, useEffect } from 'react';
import { Ativo, Setor, Responsavel } from '@/types';
import { SearchBar } from './SearchBar';
import { FiltersSidebar } from './FiltersSidebar';
import { AssetCard } from './AssetCard';
import { api } from '@/lib/axios';
import { useAuth } from '@/store/useAuth';
import { Plus, Settings, X, Edit, Trash2, Cpu, MapPin, Loader2, AlertCircle, Check, Package } from 'lucide-react';
import styles from '@/styles/AssetCatalog.module.css';

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSearch: (term: string) => Promise<{ id: string | number; name: string }[]>;
  initialName?: string;
  placeholder: string;
}

function SearchableSelect({ label, value, onChange, placeholder, onSearch, initialName }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<{ id: string | number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialName) {
      setSearchTerm(initialName);
    } else {
      setSearchTerm("");
    }
  }, [value, initialName]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(searchTerm);
        setOptions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-xs font-bold uppercase text-zinc-450">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-500 text-foreground"
          placeholder={placeholder}
        />
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50">
            {loading ? (
              <div className="px-3.5 py-2 text-xs text-zinc-400 italic">Carregando...</div>
            ) : options.length === 0 ? (
              <div className="px-3.5 py-2 text-xs text-zinc-400 italic">Nenhum resultado encontrado</div>
            ) : (
              options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(String(o.id));
                    setSearchTerm(o.name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const AssetCatalog: React.FC = () => {
  const { user } = useAuth();
  
  // 1. Estados Principais
  const [filtros, setFiltros] = useState({
    busca: '',
    categoria: 'todas',
    status: 'disponiveis',
    setor_id: 'todos',
    responsavel_id: 'todos',
    ordenacao: 'nome',
  });
  
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [pagina, setPagina] = useState<number>(1);
  const [totalItens, setTotalItens] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Metadados dos filtros
  const [categorias, setCategorias] = useState<string[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  // Estados do Modo Admin
  const [modoAdmin, setModoAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<Ativo | null>(null);
  
  // Campos do Form de Ativo
  const [formNome, setFormNome] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCategoria, setFormCategoria] = useState("Mobiliário");
  const [formResponsavel, setFormResponsavel] = useState("");
  const [formSetor, setFormSetor] = useState("");
  const [formElegivel, setFormElegivel] = useState(false);
  const [formStatus, setFormStatus] = useState("Novo");
  const [formResponsavelNome, setFormResponsavelNome] = useState("");
  const [formSetorNome, setFormSetorNome] = useState("");

  const fetchResponsaveis = async (busca: string) => {
    const res = await api.get('/usuarios/', {
      params: {
        tipo_usuario: 'Servidor',
        search: busca,
        page_size: 50
      }
    });
    const data = res.data.results || res.data || [];
    return data.map((u: any) => ({
      id: String(u.id),
      name: u.nome
    }));
  };

  const fetchSetores = async (busca: string) => {
    const res = await api.get('/setores/', {
      params: {
        search: busca,
        page_size: 50
      }
    });
    const data = res.data.results || res.data || [];
    return data.map((s: any) => ({
      id: String(s.id),
      name: s.nome || `${s.tipo} (${s.campus_detail?.sigla || ''})`
    }));
  };
  
  // Especificações de TI
  const [formMarca, setFormMarca] = useState("");
  const [formRam, setFormRam] = useState("");
  const [formArmazenamento, setFormArmazenamento] = useState("");
  const [formSo, setFormSo] = useState("Windows");
  const [formSala, setFormSala] = useState("");
  
  // Imagem
  const [formImagem, setFormImagem] = useState<File | null>(null);
  const [formImagemPreview, setFormImagemPreview] = useState<string | null>(null);

  // Status de Submissão do Form
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const ITENS_POR_PAGINA = 6;
  const isServidor = user?.tipo_usuario === 'Servidor' || !!user?.servidor_profile || (user as any)?.is_superuser;

  // 2. Carregar metadados dos filtros e salas
  const carregarMetadados = async () => {
    try {
      setCategorias(["TI", "Mobiliário", "Veículo", "Outros"]);
      
      const [resSetores, resServidores, resSalas] = await Promise.all([
        api.get('/setores/'),
        api.get('/servidores/'),
        api.get('/salas/')
      ]);

      const sectorsData = resSetores.data.results || resSetores.data || [];
      const servidoresData = resServidores.data.results || resServidores.data || [];
      const salasData = resSalas.data.results || resSalas.data || [];

      const sectors = sectorsData.map((s: any) => ({
        id: String(s.id),
        nome: s.nome || `${s.tipo} (${s.campus_detail?.sigla || ''})`,
        sigla: s.sigla
      }));

      const resps = servidoresData.map((s: any) => ({
        id: String(s.usuario?.id || s.usuario_id || s.id),
        nome: s.usuario?.nome || 'Sem Nome',
        cargo: s.cargo
      }));

      setSetores(sectors);
      setResponsaveis(resps);
      setSalas(salasData);
    } catch (e) {
      console.error('Erro ao inicializar metadados:', e);
    }
  };

  useEffect(() => {
    carregarMetadados();
  }, []);

  // 3. Buscar os ativos
  const buscarAtivos = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagina));
      params.set('page_size', String(ITENS_POR_PAGINA));
      
      if (filtros.busca) params.set('search', filtros.busca);
      if (filtros.categoria !== 'todas') params.set('categoria', filtros.categoria);
      if (filtros.status !== 'todos') params.set('status', filtros.status);
      if (filtros.setor_id !== 'todos') params.set('setor', filtros.setor_id);
      if (filtros.responsavel_id !== 'todos') params.set('responsavel', filtros.responsavel_id);
      if (filtros.ordenacao) params.set('ordering', filtros.ordenacao);

      const response = await api.get(`/ativos/?${params.toString()}`);
      const data = response.data;
      const results = data.results || data || [];
      const count = data.count || results.length;
      
      const mappedAtivos = results.map((d: any) => ({
        id: String(d.id),
        serial_patrimonio: d.serial_patrimonio,
        nome: d.nome,
        descricao: d.descricao || "",
        categoria: d.categoria,
        status: d.status,
        setor_id: String(d.setor),
        setor_nome: d.setor_detail 
          ? `${d.setor_detail.tipo} (${d.setor_detail.campus_detail?.sigla || ""})` 
          : "Sem Setor",
        responsavel_id: String(d.responsavel),
        responsavel_nome: d.responsavel_detail?.usuario?.nome || "Sem Responsável",
        imagem_url: d.imagem_url || undefined,
        dados_ti: d.ti_profile ? {
          marca: d.ti_profile.marca,
          memoria_ram_gb: d.ti_profile.memoria_ram_gb,
          armazenamento_gb: d.ti_profile.armazenamento_gb,
          sistema_operacional: d.ti_profile.sistema_operacional,
          sala: d.ti_profile.sala,
          sala_detail: d.ti_profile.sala_detail,
        } : undefined,
        data_aquisicao: d.created_at?.slice(0, 10),
      }));

      setAtivos(mappedAtivos);
      setTotalItens(count);
      setTotalPaginas(Math.ceil(count / ITENS_POR_PAGINA));
    } catch (err) {
      setErro('Falha ao se comunicar com o servidor da UnDF. Tente novamente.');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarAtivos();
  }, [filtros, pagina]);

  const handleFiltrosChange = (novosFiltros: any) => {
    setFiltros(novosFiltros);
    setPagina(1);
  };

  const handleBuscaChange = (termo: string) => {
    setFiltros((prev) => ({ ...prev, busca: termo }));
    setPagina(1);
  };

  const irParaPagina = (numPagina: number) => {
    if (numPagina >= 1 && numPagina <= totalPaginas) {
      setPagina(numPagina);
    }
  };

  // Abrir modal para novo ativo
  const handleNovoAtivo = () => {
    setEditingAtivo(null);
    setFormNome("");
    setFormSerial("");
    setFormDescricao("");
    setFormCategoria("Mobiliário");
    setFormResponsavel(responsaveis[0]?.id || "");
    setFormResponsavelNome(responsaveis[0]?.nome || "");
    setFormSetor(setores[0]?.id || "");
    setFormSetorNome(setores[0]?.nome || "");
    setFormElegivel(false);
    setFormStatus("Novo");
    setFormMarca("");
    setFormRam("8");
    setFormArmazenamento("256");
    setFormSo("Windows");
    setFormSala("");
    setFormImagem(null);
    setFormImagemPreview(null);
    setFormError(null);
    setModalOpen(true);
  };

  // Abrir modal para editar ativo
  const handleEditarAtivo = (ativo: Ativo) => {
    setEditingAtivo(ativo);
    setFormNome(ativo.nome);
    setFormSerial(ativo.serial_patrimonio);
    setFormDescricao(ativo.descricao || "");
    setFormCategoria(ativo.categoria);
    setFormResponsavel(ativo.responsavel_id);
    setFormResponsavelNome(ativo.responsavel_nome);
    setFormSetor(ativo.setor_id);
    setFormSetorNome(ativo.setor_nome);
    // @ts-ignore
    setFormElegivel(ativo.elegivel_emprestimo ?? false);
    setFormStatus(ativo.status);
    
    if (ativo.dados_ti) {
      setFormMarca(ativo.dados_ti.marca);
      setFormRam(String(ativo.dados_ti.memoria_ram_gb));
      setFormArmazenamento(String(ativo.dados_ti.armazenamento_gb));
      setFormSo(ativo.dados_ti.sistema_operacional);
      // @ts-ignore
      setFormSala(ativo.dados_ti.sala ? String(ativo.dados_ti.sala) : "");
    } else {
      setFormMarca("");
      setFormRam("8");
      setFormArmazenamento("256");
      setFormSo("Windows");
      setFormSala("");
    }
    setFormImagem(null);
    setFormImagemPreview(ativo.imagem_url || null);
    setFormError(null);
    setModalOpen(true);
  };

  // Deletar ativo
  const handleDeletarAtivo = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este ativo do sistema?")) return;
    
    try {
      await api.delete(`/ativos/${id}/`);
      buscarAtivos();
    } catch (e) {
      console.error("Erro ao deletar ativo:", e);
      alert("Falha ao excluir o ativo. Verifique se ele está emprestado no momento.");
    }
  };

  // Tratar arquivo de imagem
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImagem(file);
      const reader = new FileReader();
      reader.onload = () => setFormImagemPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submeter formulário
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formSerial.trim() || !formCategoria || !formResponsavel || !formSetor) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formCategoria === "TI" && !formMarca.trim()) {
      setFormError("A marca é obrigatória para ativos da categoria de TI.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload: any = {
      nome: formNome.trim(),
      serial_patrimonio: formSerial.trim(),
      descricao: formDescricao.trim(),
      categoria: formCategoria,
      responsavel: parseInt(formResponsavel),
      setor: parseInt(formSetor),
      status: formStatus,
      // @ts-ignore
      elegivel_emprestimo: formElegivel
    };

    if (formCategoria === "TI") {
      payload.ti_profile = {
        marca: formMarca.trim(),
        memoria_ram_gb: parseInt(formRam) || 8,
        armazenamento_gb: parseInt(formArmazenamento) || 256,
        sistema_operacional: formSo,
        sala: formSala ? parseInt(formSala) : null
      };
    }

    try {
      let ativoId = editingAtivo?.id;
      
      if (editingAtivo) {
        // Atualização
        await api.put(`/ativos/${ativoId}/`, payload);
      } else {
        // Criação
        const res = await api.post("/ativos/", payload);
        ativoId = res.data.id;
      }

      // Envia Imagem se fornecida
      if (formImagem && ativoId) {
        const fd = new FormData();
        fd.append("file", formImagem);
        await api.post(`/ativos/${ativoId}/upload_imagem/`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setModalOpen(false);
      buscarAtivos();
    } catch (err: any) {
      console.error("Erro ao salvar ativo:", err);
      setFormError(err.response?.data?.detail || "Erro ao salvar patrimônio. Verifique as informações.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Renderizar esqueleto de carregamento
  const renderSkeletons = () => {
    return Array.from({ length: ITENS_POR_PAGINA }).map((_, idx) => (
      <div key={`sk-${idx}`} className={`${styles.card} ${styles.skeletonCard}`}>
        <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
        <div className={styles.cardContent}>
          <div className={`${styles.skeleton} ${styles.skeletonText} ${styles.skShort}`} />
          <div className={`${styles.skeleton} ${styles.skeletonText} ${styles.skLong}`} />
          <div className={`${styles.skeleton} ${styles.skeletonText} ${styles.skMedium}`} />
          <div className={styles.skeletonDivider} />
          <div className={`${styles.skeleton} ${styles.skeletonText} ${styles.skShort}`} />
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      {/* Título de Entrada Consolidado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-900" />
            Catálogo de Ativos
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            {isServidor
              ? "Consulte, filtre e gerencie todos os ativos institucionais de patrimônio da UnDF."
              : "Consulte e solicite ativos elegíveis para empréstimo estudantil de seu campus."}
          </p>
        </div>
        
        {isServidor && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModoAdmin(!modoAdmin)}
              className={`inline-flex items-center gap-2 font-semibold text-sm py-2.5 px-4 rounded-lg border transition-all cursor-pointer ${
                modoAdmin
                  ? "bg-zinc-900 border-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "bg-white border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <Settings className={`w-4 h-4 ${modoAdmin ? 'animate-spin' : ''}`} />
              {modoAdmin ? "Desativar Admin" : "Modo Administrar"}
            </button>

            {modoAdmin && (
              <button
                onClick={handleNovoAtivo}
                className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm text-sm cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Ativo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barra de Busca Principal */}
      <section className={styles.searchSection}>
        <SearchBar value={filtros.busca} onChange={handleBuscaChange} />
      </section>

      {/* Conteúdo Principal */}
      <main className={styles.mainLayout}>
        <FiltersSidebar
          filtros={filtros}
          onChange={handleFiltrosChange}
          categorias={categorias}
          setores={setores}
          responsaveis={responsaveis}
        />

        <section className={styles.catalogContent}>
          <div className={styles.catalogSummary}>
            <span className={styles.resultsCount}>
              {carregando ? 'Buscando...' : `${totalItens} ${totalItens === 1 ? 'ativo encontrado' : 'ativos encontrados'}`}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="ordenacao-select" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Ordenar por:
              </label>
              <select
                id="ordenacao-select"
                value={filtros.ordenacao}
                onChange={(e) => handleFiltrosChange({ ...filtros, ordenacao: e.target.value })}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-250 outline-none focus:ring-2 focus:ring-blue-950/20 cursor-pointer"
              >
                <option value="nome">Nome (A-Z)</option>
                <option value="-nome">Nome (Z-A)</option>
                <option value="categoria">Categoria</option>
                <option value="status">Status</option>
                <option value="-created_at">Mais Recentes</option>
                <option value="created_at">Mais Antigos</option>
              </select>
            </div>
            {pagina > 1 && (
              <span className={styles.pageIndicator}>
                Página {pagina} de {totalPaginas}
              </span>
            )}
          </div>

          {erro && (
            <div className={styles.errorAlert}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.errorIcon}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{erro}</span>
            </div>
          )}

          {!erro && (
            <>
              {/* Grid dos Cards de Ativos */}
              <div className={styles.assetsGrid}>
                {carregando
                  ? renderSkeletons()
                  : ativos.map((ativo) => (
                      <AssetCard
                        key={ativo.id}
                        ativo={ativo}
                        modoAdmin={modoAdmin}
                        onEdit={handleEditarAtivo}
                        onDelete={handleDeletarAtivo}
                      />
                    ))}
              </div>

              {/* Estado Vazio */}
              {!carregando && ativos.length === 0 && (
                <div className={styles.emptyState}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.emptyIcon}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  <h4>Nenhum ativo localizado</h4>
                  <p>Tente ajustar os filtros avançados ou digite outros termos na barra de pesquisa.</p>
                  <button
                    type="button"
                    className={styles.resetButtonEmpty}
                    onClick={() =>
                      handleFiltrosChange({
                        busca: '',
                        categoria: 'todas',
                        status: 'todos',
                        setor_id: 'todos',
                        responsavel_id: 'todos',
                      })
                    }
                  >
                    Redefinir Busca e Filtros
                  </button>
                </div>
              )}

              {/* Paginação */}
              {!carregando && totalPaginas > 1 && (
                <nav className={styles.pagination} aria-label="Navegação de páginas">
                  <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => irParaPagina(pagina - 1)}
                    disabled={pagina === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Anterior</span>
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPaginas }).map((_, idx) => {
                      const numPag = idx + 1;
                      return (
                        <button
                          key={`pag-${numPag}`}
                          type="button"
                          className={`${styles.pageNumberButton} ${pagina === numPag ? styles.activePage : ''}`}
                          onClick={() => irParaPagina(numPag)}
                        >
                          {numPag}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => irParaPagina(pagina + 1)}
                    disabled={pagina === totalPaginas}
                  >
                    <span>Próxima</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      {/* Drawer/Modal para Cadastrar / Editar Ativo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-lg h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-150">
            {/* Header do Modal */}
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-lg flex items-center gap-1.5">
                  {editingAtivo ? <Edit className="w-5 h-5 text-blue-900" /> : <Plus className="w-5 h-5 text-blue-900" />}
                  {editingAtivo ? "Editar Ativo" : "Cadastrar Novo Ativo"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {editingAtivo ? `ID: ${editingAtivo.id} · Serial: ${editingAtivo.serial_patrimonio}` : "Informe os dados básicos do novo patrimônio."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex gap-2">
                    <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nome */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-zinc-450">Nome do Item *</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Ex: Projetor Epson X41"
                  />
                </div>

                {/* Patrimônio (Serial) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-zinc-450">Código Patrimonial (Serial) *</label>
                  <input
                    type="text"
                    required
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Ex: UNDF20261022"
                  />
                </div>

                {/* Categoria */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-zinc-450">Categoria *</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="TI">TI (Computadores/Notebooks)</option>
                    <option value="Veículo">Veículo</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Especificações de TI */}
                {formCategoria === "TI" && (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" /> Detalhes de Hardware
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block uppercase">Marca *</label>
                        <input
                          type="text"
                          required
                          value={formMarca}
                          onChange={(e) => setFormMarca(e.target.value)}
                          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                          placeholder="Ex: Dell, Lenovo"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block uppercase">S.O. *</label>
                        <select
                          value={formSo}
                          onChange={(e) => setFormSo(e.target.value)}
                          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="Windows">Windows</option>
                          <option value="Linux">Linux</option>
                          <option value="macOS">macOS</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block uppercase">Memória RAM (GB) *</label>
                        <input
                          type="number"
                          required
                          value={formRam}
                          onChange={(e) => setFormRam(e.target.value)}
                          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                          placeholder="Ex: 8, 16"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block uppercase">Armazenamento (GB) *</label>
                        <input
                          type="number"
                          required
                          value={formArmazenamento}
                          onChange={(e) => setFormArmazenamento(e.target.value)}
                          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                          placeholder="Ex: 256, 512"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 block uppercase">Sala / Laboratório Fixo</label>
                      <select
                        value={formSala}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSala(val);
                          if (val) {
                            setFormElegivel(false);
                          }
                        }}
                        className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Avulso / Lendable (sem sala fixa)</option>
                        {salas.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.tipo} {s.numero} ({s.campus_detail?.sigla || ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Descrição */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-zinc-450">Descrição / Justificativa</label>
                  <textarea
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    rows={2}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Observações complementares..."
                  />
                </div>

                {/* Responsável */}
                <SearchableSelect
                  label="Servidor Responsável *"
                  value={formResponsavel}
                  onChange={setFormResponsavel}
                  onSearch={fetchResponsaveis}
                  initialName={formResponsavelNome}
                  placeholder="Selecione ou digite um Servidor..."
                />

                {/* Setor */}
                <SearchableSelect
                  label="Setor Alocado *"
                  value={formSetor}
                  onChange={setFormSetor}
                  onSearch={fetchSetores}
                  initialName={formSetorNome}
                  placeholder="Selecione ou digite um Setor..."
                />

                {/* Status e Elegível para Empréstimo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-zinc-450">Status de Conservação</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Disponivel">Disponível</option>
                      <option value="Avariado">Avariado</option>
                      <option value="Desempossado">Desempossado</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={formElegivel}
                        disabled={!!formSala}
                        onChange={(e) => setFormElegivel(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-blue-900 focus:ring-blue-900 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                        Elegível p/ Empréstimo
                      </span>
                    </label>
                  </div>
                </div>

                {/* Foto / Imagem */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-zinc-450 block">Foto do Patrimônio</label>
                  {formImagemPreview && (
                    <div className="relative rounded-lg overflow-hidden border border-zinc-200 mb-2 max-h-32 bg-zinc-50 flex items-center justify-center">
                      <img src={formImagemPreview} alt="Preview" className="h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormImagem(null);
                          setFormImagemPreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-650/90 text-white rounded-full p-1 border hover:bg-red-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-white dark:bg-zinc-900 sticky bottom-0 z-10 py-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-75 cursor-pointer transition-colors"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAtivo ? "Salvar Alterações" : "Cadastrar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
