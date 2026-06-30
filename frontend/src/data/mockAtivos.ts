import { Ativo, Setor, Responsavel, APIResponseAtivos, FiltrosAtivos } from '../types';

export const mockSetores: Setor[] = [
  { id: 'setor-1', nome: 'Reitoria', sigla: 'REIT' },
  { id: 'setor-2', nome: 'Tecnologia da Informação e CPD', sigla: 'TI' },
  { id: 'setor-3', nome: 'Recursos Humanos', sigla: 'RH' },
  { id: 'setor-4', nome: 'Biblioteca Central', sigla: 'BC' },
  { id: 'setor-5', nome: 'Secretaria Acadêmica', sigla: 'SEC' },
];

export const mockResponsaveis: Responsavel[] = [
  { id: 'resp-1', nome: 'Prof. Dr. Ricardo Silva', cargo: 'Reitor' },
  { id: 'resp-2', nome: 'Ana Carolina Souza', cargo: 'Diretora de TI' },
  { id: 'resp-3', nome: 'Carlos Eduardo Oliveira', cargo: 'Coordenador de RH' },
  { id: 'resp-4', nome: 'Mariana Costa Lima', cargo: 'Bibliotecária Chefe' },
  { id: 'resp-5', nome: 'Lucas Silveira Melo', cargo: 'Secretário Geral' },
];

export const mockAtivos: Ativo[] = [
  {
    id: 'ativo-1',
    serial_patrimonio: 'UNDF-2026-0001',
    nome: 'Notebook Dell Latitude 5440',
    descricao: 'Notebook corporativo para uso da equipe técnica de desenvolvimento de sistemas.',
    categoria: 'TI',
    status: 'Novo',
    setor_id: 'setor-2',
    setor_nome: 'Tecnologia da Informação e CPD',
    responsavel_id: 'resp-2',
    responsavel_nome: 'Ana Carolina Souza',
    imagem_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Dell',
      memoria_ram_gb: 16,
      armazenamento_gb: 512,
      sistema_operacional: 'Ubuntu Linux 24.04',
    },
    data_aquisicao: '2026-02-15',
  },
  {
    id: 'ativo-2',
    serial_patrimonio: 'UNDF-2026-0002',
    nome: 'Notebook Dell Latitude 5440',
    descricao: 'Notebook institucional para a assessoria de comunicação.',
    categoria: 'TI',
    status: 'Emprestado',
    setor_id: 'setor-1',
    setor_nome: 'Reitoria',
    responsavel_id: 'resp-1',
    responsavel_nome: 'Prof. Dr. Ricardo Silva',
    imagem_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Dell',
      memoria_ram_gb: 16,
      armazenamento_gb: 512,
      sistema_operacional: 'Windows 11 Pro',
    },
    data_aquisicao: '2026-02-15',
  },
  {
    id: 'ativo-3',
    serial_patrimonio: 'UNDF-2026-0003',
    nome: 'Monitor UltraWide LG 29"',
    descricao: 'Monitor ultrawide para visualização de planilhas e relatórios acadêmicos.',
    categoria: 'TI',
    status: 'Novo',
    setor_id: 'setor-5',
    setor_nome: 'Secretaria Acadêmica',
    responsavel_id: 'resp-5',
    responsavel_nome: 'Lucas Silveira Melo',
    imagem_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'LG',
      memoria_ram_gb: 0,
      armazenamento_gb: 0,
      sistema_operacional: 'N/A',
    },
    data_aquisicao: '2026-03-01',
  },
  {
    id: 'ativo-4',
    serial_patrimonio: 'UNDF-2025-0089',
    nome: 'Cadeira Ergonômica Herman Miller Aeron',
    descricao: 'Cadeira ergonômica de alta performance para a sala da reitoria.',
    categoria: 'Mobiliário',
    status: 'Novo',
    setor_id: 'setor-1',
    setor_nome: 'Reitoria',
    responsavel_id: 'resp-1',
    responsavel_nome: 'Prof. Dr. Ricardo Silva',
    imagem_url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60',
    data_aquisicao: '2025-11-10',
  },
  {
    id: 'ativo-5',
    serial_patrimonio: 'UNDF-2024-0312',
    nome: 'Projetor Epson PowerLite FH52+',
    descricao: 'Projetor multimídia utilizado para defesas de tese e reuniões do conselho.',
    categoria: 'TI',
    status: 'Avariado',
    setor_id: 'setor-1',
    setor_nome: 'Reitoria',
    responsavel_id: 'resp-1',
    responsavel_nome: 'Prof. Dr. Ricardo Silva',
    imagem_url: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Epson',
      memoria_ram_gb: 0,
      armazenamento_gb: 0,
      sistema_operacional: 'Firmware Epson',
    },
    data_aquisicao: '2024-05-20',
  },
  {
    id: 'ativo-6',
    serial_patrimonio: 'UNDF-2025-0145',
    nome: 'Mesa de Reuniões Oval 12 Lugares',
    descricao: 'Mesa de madeira maciça de lei para reuniões institucionais.',
    categoria: 'Mobiliário',
    status: 'Novo',
    setor_id: 'setor-1',
    setor_nome: 'Reitoria',
    responsavel_id: 'resp-1',
    responsavel_nome: 'Prof. Dr. Ricardo Silva',
    imagem_url: 'https://images.unsplash.com/photo-1530099486328-e021101a494a?w=600&auto=format&fit=crop&q=60',
    data_aquisicao: '2025-04-12',
  },
  {
    id: 'ativo-7',
    serial_patrimonio: 'UNDF-2025-0220',
    nome: 'Servidor Dell PowerEdge T350',
    descricao: 'Servidor local de arquivos e backup interno da secretaria.',
    categoria: 'TI',
    status: 'Novo',
    setor_id: 'setor-2',
    setor_nome: 'Tecnologia da Informação e CPD',
    responsavel_id: 'resp-2',
    responsavel_nome: 'Ana Carolina Souza',
    imagem_url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Dell',
      memoria_ram_gb: 64,
      armazenamento_gb: 4000,
      sistema_operacional: 'Windows Server 2022',
    },
    data_aquisicao: '2025-08-18',
  },
  {
    id: 'ativo-8',
    serial_patrimonio: 'UNDF-2024-0112',
    nome: 'Ar Condicionado Split Electrolux 18000 BTU',
    descricao: 'Aparelho de ar condicionado instalado na ala oeste da biblioteca.',
    categoria: 'Eletrodomésticos',
    status: 'Avariado',
    setor_id: 'setor-4',
    setor_nome: 'Biblioteca Central',
    responsavel_id: 'resp-4',
    responsavel_nome: 'Mariana Costa Lima',
    imagem_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60',
    data_aquisicao: '2024-02-10',
  },
  {
    id: 'ativo-9',
    serial_patrimonio: 'UNDF-2023-0043',
    nome: 'Leitor de Código de Barras Honeywell',
    descricao: 'Leitor óptico USB para registro de empréstimos de livros na biblioteca.',
    categoria: 'TI',
    status: 'Emprestado',
    setor_id: 'setor-4',
    setor_nome: 'Biblioteca Central',
    responsavel_id: 'resp-4',
    responsavel_nome: 'Mariana Costa Lima',
    imagem_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Honeywell',
      memoria_ram_gb: 0,
      armazenamento_gb: 0,
      sistema_operacional: 'N/A',
    },
    data_aquisicao: '2023-09-05',
  },
  {
    id: 'ativo-10',
    serial_patrimonio: 'UNDF-2023-0005',
    nome: 'Notebook Lenovo ThinkPad L14',
    descricao: 'Notebook antigo de desenvolvimento com tela avariada, aguardando descarte ou leilão.',
    categoria: 'TI',
    status: 'Desempossado',
    setor_id: 'setor-2',
    setor_nome: 'Tecnologia da Informação e CPD',
    responsavel_id: 'resp-2',
    responsavel_nome: 'Ana Carolina Souza',
    imagem_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Lenovo',
      memoria_ram_gb: 8,
      armazenamento_gb: 240,
      sistema_operacional: 'Windows 10 Pro',
    },
    data_aquisicao: '2023-01-20',
  },
  {
    id: 'ativo-11',
    serial_patrimonio: 'UNDF-2026-0045',
    nome: 'Multifuncional Kyocera Taskalfa 4053ci',
    descricao: 'Impressora de grande porte alugada para impressão de provas e documentos acadêmicos.',
    categoria: 'TI',
    status: 'Novo',
    setor_id: 'setor-5',
    setor_nome: 'Secretaria Acadêmica',
    responsavel_id: 'resp-5',
    responsavel_nome: 'Lucas Silveira Melo',
    imagem_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Kyocera',
      memoria_ram_gb: 4,
      armazenamento_gb: 320,
      sistema_operacional: 'KFS OS',
    },
    data_aquisicao: '2026-01-10',
  },
  {
    id: 'ativo-12',
    serial_patrimonio: 'UNDF-2025-0551',
    nome: 'Gaveteiro Volante 3 Gavetas',
    descricao: 'Gaveteiro com chave, fixado abaixo da bancada de atendimento.',
    categoria: 'Mobiliário',
    status: 'Novo',
    setor_id: 'setor-5',
    setor_nome: 'Secretaria Acadêmica',
    responsavel_id: 'resp-5',
    responsavel_nome: 'Lucas Silveira Melo',
    imagem_url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&auto=format&fit=crop&q=60',
    data_aquisicao: '2025-07-04',
  },
  {
    id: 'ativo-13',
    serial_patrimonio: 'UNDF-2024-0010',
    nome: 'Geladeira Duplex Consul 386L',
    descricao: 'Geladeira para a copa da reitoria e assessores.',
    categoria: 'Eletrodomésticos',
    status: 'Emprestado',
    setor_id: 'setor-1',
    setor_nome: 'Reitoria',
    responsavel_id: 'resp-1',
    responsavel_nome: 'Prof. Dr. Ricardo Silva',
    imagem_url: 'https://images.unsplash.com/photo-1571175482282-463871f14668?w=600&auto=format&fit=crop&q=60',
    data_aquisicao: '2024-01-15',
  },
  {
    id: 'ativo-14',
    serial_patrimonio: 'UNDF-2026-0099',
    nome: 'Roteador Wi-Fi 6 Enterprise Ubiquiti U6-Pro',
    descricao: 'Access Point para cobertura da Biblioteca Central de alta densidade.',
    categoria: 'TI',
    status: 'Novo',
    setor_id: 'setor-4',
    setor_nome: 'Biblioteca Central',
    responsavel_id: 'resp-4',
    responsavel_nome: 'Mariana Costa Lima',
    imagem_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60',
    dados_ti: {
      marca: 'Ubiquiti',
      memoria_ram_gb: 1,
      armazenamento_gb: 1,
      sistema_operacional: 'UniFi OS',
    },
    data_aquisicao: '2026-04-03',
  },
  {
    id: 'ativo-15',
    serial_patrimonio: 'UNDF-2025-0902',
    nome: 'Armário de Aço de Canto 2 Portas',
    descricao: 'Armário de arquivo de prontuários de servidores no RH.',
    categoria: 'Mobiliário',
    status: 'Novo',
    setor_id: 'setor-3',
    setor_nome: 'Recursos Humanos',
    responsavel_id: 'resp-3',
    responsavel_nome: 'Carlos Eduardo Oliveira',
    imagem_url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&auto=format&fit=crop&q=60',
    data_aquisicao: '2025-06-30',
  }
];

// Helper to simulate a GET fetch with query params from /api/ativos
export const fetchAtivosMock = (
  filtros: FiltrosAtivos,
  page: number = 1,
  limit: number = 6
): Promise<APIResponseAtivos> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      let result = [...mockAtivos];

      // Textual Search: Nome ou Serial
      if (filtros.busca.trim() !== '') {
        const query = filtros.busca.toLowerCase();
        result = result.filter(
          (ativo) =>
            ativo.nome.toLowerCase().includes(query) ||
            ativo.serial_patrimonio.toLowerCase().includes(query)
        );
      }

      // Filter by Category
      if (filtros.categoria && filtros.categoria !== 'todas') {
        result = result.filter((ativo) => ativo.categoria === filtros.categoria);
      }

      // Filter by Status
      if (filtros.status && filtros.status !== 'todos') {
        result = result.filter((ativo) => ativo.status === filtros.status);
      }

      // Filter by Sector
      if (filtros.setor_id && filtros.setor_id !== 'todos') {
        result = result.filter((ativo) => ativo.setor_id === filtros.setor_id);
      }

      // Filter by Responsible
      if (filtros.responsavel_id && filtros.responsavel_id !== 'todos') {
        result = result.filter((ativo) => ativo.responsavel_id === filtros.responsavel_id);
      }

      const total = result.length;
      const pages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedAtivos = result.slice(offset, offset + limit);

      resolve({
        ativos: paginatedAtivos,
        total,
        page,
        pages,
      });
    }, 400); // 400ms delay to feel realistic
  });
};

export const obterCategoriasUnicas = (): string[] => {
  const cats = mockAtivos.map((a) => a.categoria);
  return Array.from(new Set(cats));
};
