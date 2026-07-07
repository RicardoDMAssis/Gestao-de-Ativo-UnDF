import React from 'react';
import { Ativo } from '@/types';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2 } from 'lucide-react';
import styles from '@/styles/AssetCatalog.module.css';

interface AssetCardProps {
  ativo: Ativo;
  modoAdmin?: boolean;
  onEdit?: (ativo: Ativo) => void;
  onDelete?: (id: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ ativo, modoAdmin = false, onEdit, onDelete }) => {
  const router = useRouter();
  const {
    id,
    nome,
    serial_patrimonio,
    categoria,
    status,
    setor_nome,
    responsavel_nome,
    imagem_url,
    dados_ti,
  } = ativo;

  const getStatusClass = (statusVal: typeof status): string => {
    switch (statusVal) {
      case 'Novo':
        return styles.statusNovo;
      case 'Emprestado':
        return styles.statusEmprestado;
      case 'Avariado':
        return styles.statusAvariado;
      case 'Desempossado':
        return styles.statusDesempossado;
      default:
        return styles.statusPadrao;
    }
  };

  const fallbackImg =
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60';

  const isTI = categoria.toUpperCase() === 'TI' && dados_ti;

  const handleCardClick = () => {
    router.push(`/ativos/${id}`);
  };

  return (
    <article 
      onClick={handleCardClick}
      className={`${styles.card} ${isTI ? styles.cardTI : ''} cursor-pointer hover:shadow-md transition-shadow relative group`}
    >
      <div className={styles.cardImageWrapper}>
        <img
          src={imagem_url || fallbackImg}
          alt={nome}
          className={styles.cardImage}
          loading="lazy"
        />
        <div className={styles.cardBadges}>
          <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
            {status}
          </span>
          <span className={styles.categoryTag}>{categoria}</span>
        </div>

        {/* Botões de Ações Administrativas */}
        {modoAdmin && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm p-1.5 rounded-lg z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(ativo);
              }}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="Editar Ativo"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(id);
              }}
              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              title="Excluir Ativo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
        <span className={styles.serialPatrimonio}>{serial_patrimonio}</span>
        <h4 className={styles.cardTitle} title={nome}>
          {nome}
        </h4>
        <p className={styles.cardDescription}>{ativo.descricao}</p>

        {isTI && (
          <div className={styles.tiSpecsContainer}>
            <div className={styles.tiSpecsHeader}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.tiIcon}
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Especificações de TI</span>
            </div>
            <div className={styles.tiSpecsGrid}>
              <div className={styles.tiSpecItem}>
                <span className={styles.specLabel}>Marca</span>
                <span className={styles.specVal}>{dados_ti.marca}</span>
              </div>
              <div className={styles.tiSpecItem}>
                <span className={styles.specLabel}>RAM</span>
                <span className={styles.specVal}>{dados_ti.memoria_ram_gb} GB</span>
              </div>
              <div className={styles.tiSpecItem}>
                <span className={styles.specLabel}>Armaz.</span>
                <span className={styles.specVal}>{dados_ti.armazenamento_gb} GB</span>
              </div>
              <div className={styles.tiSpecItem}>
                <span className={styles.specLabel}>S.O.</span>
                <span className={styles.specVal} title={dados_ti.sistema_operacional}>
                  {dados_ti.sistema_operacional}
                </span>
              </div>
              {/* @ts-ignore */}
              {dados_ti.sala_detail && (
                <div className="col-span-2 text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 p-1 rounded font-semibold mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {/* @ts-ignore */}
                  Local: {dados_ti.sala_detail.tipo} {dados_ti.sala_detail.numero}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.cardMeta}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Setor:</span>
            <span className={styles.metaValue}>{setor_nome}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Resp:</span>
            <span className={styles.metaValue}>{responsavel_nome}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
