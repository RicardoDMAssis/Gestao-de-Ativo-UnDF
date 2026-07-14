export type StatusAtivo = 'Novo' | 'Avariado' | 'Desempossado' | 'Emprestado' | 'Disponivel' | 'Em_Uso';

export interface AtivoTI {
  marca: string;
  memoria_ram_gb: number;
  armazenamento_gb: number;
  sistema_operacional: string;
}

export interface Ativo {
  id: string;
  serial_patrimonio: string;
  nome: string;
  descricao: string;
  categoria: string;
  status: StatusAtivo;
  setor_id: string;
  setor_nome: string;
  responsavel_id: string;
  responsavel_nome: string;
  imagem_url?: string;
  dados_ti?: AtivoTI;
  data_aquisicao?: string;
  emprestado?: boolean;
  elegivel_emprestimo?: boolean;
}

export interface Setor {
  id: string;
  nome: string;
  sigla: string;
}

export interface Responsavel {
  id: string;
  nome: string;
  cargo: string;
}

export interface FiltrosAtivos {
  busca: string;
  categoria: string;
  status: string;
  setor_id: string;
  responsavel_id: string;
}

export interface APIResponseAtivos {
  ativos: Ativo[];
  total: number;
  page: number;
  pages: number;
}
