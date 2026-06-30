import React, { useState, useEffect } from 'react';
import { FiltrosAtivos, Ativo, Setor, Responsavel } from '../types';
import { SearchBar } from './SearchBar';
import { FiltersSidebar } from './FiltersSidebar';
import { AssetCard } from './AssetCard';
import {
  fetchAtivosMock,
  obterCategoriasUnicas,
  mockSetores,
  mockResponsaveis,
} from '../data/mockAtivos';
import styles from '../styles/AssetCatalog.module.css';

export const AssetCatalog: React.FC = () => {
  // 1. Estados Principais
  const [filtros, setFiltros] = useState<FiltrosAtivos>({
    busca: '',
    categoria: 'todas',
    status: 'todos',
    setor_id: 'todos',
    responsavel_id: 'todos',
  });
  
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [pagina, setPagina] = useState<number>(1);
  const [totalItens, setTotalItens] = useState<number>(0);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Dados auxiliares para os filtros (obtidos do mock/banco)
  const [categorias, setCategorias] = useState<string[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);

  const ITENS_POR_PAGINA = 6;

  // 2. Carregar dados estáticos dos filtros
  useEffect(() => {
    try {
      setCategorias(obterCategoriasUnicas());
      setSetores(mockSetores);
      setResponsaveis(mockResponsaveis);
    } catch (e) {
      console.error('Erro ao inicializar metadados dos filtros:', e);
    }
  }, []);

  // 3. Efeito para buscar os ativos (Simulando chamada à API GET /api/ativos/)
  useEffect(() => {
    let ativo = true;
    
    const buscarDados = async () => {
      setCarregando(true);
      setErro(null);
      try {
        const response = await fetchAtivosMock(filtros, pagina, ITENS_POR_PAGINA);
        if (ativo) {
          setAtivos(response.ativos);
          setTotalItens(response.total);
          setTotalPaginas(response.pages);
        }
      } catch (err) {
        if (ativo) {
          setErro('Falha ao se comunicar com o servidor da UnDF. Tente novamente.');
          console.error(err);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    buscarDados();

    return () => {
      ativo = false;
    };
  }, [filtros, pagina]);

  // Resetar para a página 1 ao alterar filtros (exceto busca para evitar saltos bruscos enquanto digita)
  const handleFiltrosChange = (novosFiltros: FiltrosAtivos) => {
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

  // Renderizar esqueleto de carregamento (Skeleton loader)
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
      {/* Header do Sistema */}
      <header className={styles.header}>
        <div className={styles.brandContainer}>
          <div className={styles.logoBadge}>UnDF</div>
          <div>
            <h1 className={styles.title}>Catálogo de Ativos</h1>
            <p className={styles.subtitle}>
              Sistema de Controle de Patrimônio e Almoxarifado - Universidade do Distrito Federal
            </p>
          </div>
        </div>
      </header>

      {/* Barra de Busca Principal */}
      <section className={styles.searchSection}>
        <SearchBar value={filtros.busca} onChange={handleBuscaChange} />
      </section>

      {/* Conteúdo Principal: Layout em Grid de Duas Colunas (Filtros e Grid de Ativos) */}
      <main className={styles.mainLayout}>
        {/* Sidebar com filtros avançados */}
        <FiltersSidebar
          filtros={filtros}
          onChange={handleFiltrosChange}
          categorias={categorias}
          setores={setores}
          responsaveis={responsaveis}
        />

        {/* Listagem de ativos e paginação */}
        <section className={styles.catalogContent}>
          <div className={styles.catalogSummary}>
            <span className={styles.resultsCount}>
              {carregando ? 'Buscando...' : `${totalItens} ${totalItens === 1 ? 'ativo encontrado' : 'ativos encontrados'}`}
            </span>
            {pagina > 1 && (
              <span className={styles.pageIndicator}>
                Página {pagina} de {totalPaginas}
              </span>
            )}
          </div>

          {erro && (
            <div className={styles.errorAlert}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={styles.errorIcon}
              >
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
                  : ativos.map((ativo) => <AssetCard key={ativo.id} ativo={ativo} />)}
              </div>

              {/* Estado Vazio (Nenhum resultado) */}
              {!carregando && ativos.length === 0 && (
                <div className={styles.emptyState}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.emptyIcon}
                  >
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
                    aria-label="Página anterior"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
                    aria-label="Próxima página"
                  >
                    <span>Próxima</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};
