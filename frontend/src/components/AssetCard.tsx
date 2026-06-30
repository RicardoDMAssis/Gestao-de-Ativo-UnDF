import React from 'react';
import { Ativo } from '../types';
import styles from '../styles/AssetCatalog.module.css';

interface AssetCardProps {
  ativo: Ativo;
}

export const AssetCard: React.FC<AssetCardProps> = ({ ativo }) => {
  const {
    nome,
    serial_patrimonio,
    categoria,
    status,
    setor_nome,
    responsavel_nome,
    imagem_url,
    dados_ti,
  } = ativo;

  // Determine standard colors for the status badges
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

  // Fallback image in case imagem_url is not set or fails
  const fallbackImg =
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60';

  const isTI = categoria.toUpperCase() === 'TI' && dados_ti;

  return (
    <article className={`${styles.card} ${isTI ? styles.cardTI : ''}`}>
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
      </div>

      <div className={styles.cardContent}>
        <span className={styles.serialPatrimonio}>{serial_patrimonio}</span>
        <h4 className={styles.cardTitle} title={nome}>
          {nome}
        </h4>
        <p className={styles.cardDescription}>{ativo.descricao}</p>

        {/* TI fields section if category is TI */}
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
