import React from 'react';
import { FiltrosAtivos, Setor, Responsavel, StatusAtivo } from '@/types';
import styles from '@/styles/AssetCatalog.module.css';

interface FiltersSidebarProps {
  filtros: FiltrosAtivos;
  onChange: (novosFiltros: FiltrosAtivos) => void;
  categorias: string[];
  setores: Setor[];
  responsaveis: Responsavel[];
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filtros,
  onChange,
  categorias,
  setores,
  responsaveis,
}) => {
  const handleSelectChange = (
    campo: keyof Omit<FiltrosAtivos, 'busca'>,
    valor: string
  ) => {
    onChange({
      ...filtros,
      [campo]: valor,
    });
  };

  const handleReset = () => {
    onChange({
      busca: filtros.busca, // mantém o termo de busca atual se desejado, ou limpa
      categoria: 'todas',
      status: 'todos',
      setor_id: 'todos',
      responsavel_id: 'todos',
    });
  };

  const statusOptions: { valor: StatusAtivo | 'todos'; label: string }[] = [
    { valor: 'todos', label: 'Todos os Status' },
    { valor: 'Novo', label: 'Novo' },
    { valor: 'Emprestado', label: 'Emprestado' },
    { valor: 'Avariado', label: 'Avariado' },
    { valor: 'Desempossado', label: 'Desempossado' },
  ];

  const hasActiveFilters =
    filtros.categoria !== 'todas' ||
    filtros.status !== 'todos' ||
    filtros.setor_id !== 'todos' ||
    filtros.responsavel_id !== 'todos';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>Filtros Avançados</h3>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.resetFiltersButton}
            onClick={handleReset}
          >
            Limpar
          </button>
        )}
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="filtro-categoria" className={styles.filterLabel}>
          Categoria
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="filtro-categoria"
            className={styles.filterSelect}
            value={filtros.categoria}
            onChange={(e) => handleSelectChange('categoria', e.target.value)}
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="filtro-status" className={styles.filterLabel}>
          Status
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="filtro-status"
            className={styles.filterSelect}
            value={filtros.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.valor} value={opt.valor}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="filtro-setor" className={styles.filterLabel}>
          Setor Destino
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="filtro-setor"
            className={styles.filterSelect}
            value={filtros.setor_id}
            onChange={(e) => handleSelectChange('setor_id', e.target.value)}
          >
            <option value="todos">Todos os setores</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome} ({setor.sigla})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="filtro-responsavel" className={styles.filterLabel}>
          Responsável Técnico/Administrativo
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="filtro-responsavel"
            className={styles.filterSelect}
            value={filtros.responsavel_id}
            onChange={(e) => handleSelectChange('responsavel_id', e.target.value)}
          >
            <option value="todos">Todos os responsáveis</option>
            {responsaveis.map((resp) => (
              <option key={resp.id} value={resp.id}>
                {resp.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.activeFiltersIndicator}>
        <span className={styles.activeFiltersText}>
          {hasActiveFilters
            ? 'Filtros aplicados'
            : 'Mostrando todos os registros'}
        </span>
      </div>
    </aside>
  );
};
