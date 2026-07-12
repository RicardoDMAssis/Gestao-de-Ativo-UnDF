import React from 'react';
import { FiltrosAtivos, Setor, Responsavel, StatusAtivo } from '@/types';
import { 
  Layers, 
  Laptop, 
  Sofa, 
  Car, 
  Boxes, 
  MapPin, 
  User, 
  X, 
  Filter,
  ChevronDown
} from 'lucide-react';

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
      busca: filtros.busca,
      categoria: 'todas',
      status: 'disponiveis',
      setor_id: 'todos',
      responsavel_id: 'todos',
    });
  };

  const hasActiveFilters =
    filtros.categoria !== 'todas' ||
    filtros.status !== 'disponiveis' ||
    filtros.setor_id !== 'todos' ||
    filtros.responsavel_id !== 'todos';

  // Count active filters for badge
  const activeFiltersCount = [
    filtros.categoria !== 'todas',
    filtros.status !== 'disponiveis',
    filtros.setor_id !== 'todos',
    filtros.responsavel_id !== 'todos'
  ].filter(Boolean).length;

  const renderCategoriaIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'ti':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'mobiliário':
      case 'mobilia':
        return <Sofa className="w-3.5 h-3.5" />;
      case 'veículo':
      case 'veiculo':
        return <Car className="w-3.5 h-3.5" />;
      default:
        return <Boxes className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponiveis':
        return { dot: 'bg-green-500', activeBg: 'bg-green-600 border-green-700 text-white' };
      case 'Emprestado':
        return { dot: 'bg-amber-500', activeBg: 'bg-amber-600 border-amber-700 text-white' };
      default:
        return { dot: 'bg-zinc-400', activeBg: 'bg-zinc-800 border-zinc-900 text-white' };
    }
  };

  const statusList: { valor: any; label: string }[] = [
    { valor: 'disponiveis', label: 'Disponíveis' },
    { valor: 'Emprestado', label: 'Emprestados' },
    { valor: 'todos', label: 'Todos' },
  ];

  return (
    <aside className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm space-y-6 sticky top-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-900" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Filtros
          </h3>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-650 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1 rounded transition-colors"
            onClick={handleReset}
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-450 uppercase tracking-widest block">
          Categoria
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectChange('categoria', 'todas')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border shadow-sm ${
              filtros.categoria === 'todas'
                ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Todas
          </button>
          {categorias.map((cat) => {
            const active = filtros.categoria === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectChange('categoria', cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border shadow-sm ${
                  active
                    ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-100'
                }`}
              >
                {renderCategoriaIcon(cat)}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-450 uppercase tracking-widest block">
          Disponibilidade
        </label>
        <div className="flex flex-wrap gap-1.5">
          {statusList.map((opt) => {
            const active = filtros.status === opt.valor;
            const colors = getStatusColor(opt.valor);
            return (
              <button
                key={opt.valor}
                type="button"
                onClick={() => handleSelectChange('status', opt.valor)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                  active
                    ? colors.activeBg
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-100'
                }`}
              >
                {opt.valor !== 'todos' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${active ? 'bg-white' : ''}`} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Setor */}
      <div className="space-y-2">
        <label htmlFor="filtro-setor" className="text-xs font-bold text-zinc-450 uppercase tracking-widest block">
          Setor Alocado
        </label>
        <div className="relative flex items-center">
          <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <select
            id="filtro-setor"
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold bg-white dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
            value={filtros.setor_id}
            onChange={(e) => handleSelectChange('setor_id', e.target.value)}
          >
            <option value="todos">Todos os setores</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
        </div>
      </div>

      {/* Responsável */}
      <div className="space-y-2">
        <label htmlFor="filtro-responsavel" className="text-xs font-bold text-zinc-450 uppercase tracking-widest block">
          Responsável Patrimonial
        </label>
        <div className="relative flex items-center">
          <User className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <select
            id="filtro-responsavel"
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold bg-white dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
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
          <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
        </div>
      </div>

      {/* Indicator */}
      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border border-zinc-150 dark:border-zinc-800/80 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 font-medium">
        <Filter className="w-3 h-3 text-zinc-400" />
        {hasActiveFilters
          ? `${activeFiltersCount} ${activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}`
          : 'Exibindo todos os ativos'}
      </div>
    </aside>
  );
};
