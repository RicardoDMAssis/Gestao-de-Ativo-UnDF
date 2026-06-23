-- 1. Create Enums
CREATE TYPE public.tipo_setor_enum AS ENUM ('Administrativo', 'Academico', 'Outro');
CREATE TYPE public.tipo_usuario_enum AS ENUM ('Aluno', 'Professor', 'Servidor');
CREATE TYPE public.tipo_atividade_enum AS ENUM ('Iniciacao_Cientifica', 'Monitoria', 'Estagio', 'Extensao');
CREATE TYPE public.status_atividade_enum AS ENUM ('Em_Andamento', 'Concluido', 'Cancelado');
CREATE TYPE public.status_ativo_enum AS ENUM ('Novo', 'Em_Uso', 'Em_Manutencao', 'Baixado', 'Disponivel', 'Emprestado');
CREATE TYPE public.status_emprestimo_enum AS ENUM ('Ativo', 'Devolvido', 'Atrasado', 'Cancelado');
CREATE TYPE public.status_conservacao_enum AS ENUM ('Excelente', 'Bom', 'Regular', 'Danificado');

-- 2. Create Sequences
CREATE SEQUENCE public.escolas_id_seq;
CREATE SEQUENCE public.campi_id_seq;
CREATE SEQUENCE public.setores_id_seq;
CREATE SEQUENCE public.cursos_id_seq;
CREATE SEQUENCE public.usuarios_id_seq;
CREATE SEQUENCE public.atividades_academicas_id_seq;
CREATE SEQUENCE public.ativos_id_seq;
CREATE SEQUENCE public.softwares_id_seq;
CREATE SEQUENCE public.instalacoes_software_id_seq;
CREATE SEQUENCE public.movimentacoes_ativo_id_seq;
CREATE SEQUENCE public.emprestimos_id_seq;

-- 3. Create Tables in dependency order
CREATE TABLE public.escolas (
  id bigint NOT NULL DEFAULT nextval('escolas_id_seq'::regclass),
  nome character varying NOT NULL,
  sigla character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT escolas_pkey PRIMARY KEY (id)
);

CREATE TABLE public.campi (
  id bigint NOT NULL DEFAULT nextval('campi_id_seq'::regclass),
  nome character varying NOT NULL,
  sigla character varying NOT NULL UNIQUE,
  cidade character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campi_pkey PRIMARY KEY (id)
);

CREATE TABLE public.setores (
  id bigint NOT NULL DEFAULT nextval('setores_id_seq'::regclass),
  campus_id bigint NOT NULL,
  tipo public.tipo_setor_enum NOT NULL,
  email character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT setores_pkey PRIMARY KEY (id),
  CONSTRAINT setores_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campi(id)
);

CREATE TABLE public.cursos (
  id bigint NOT NULL DEFAULT nextval('cursos_id_seq'::regclass),
  escola_id bigint NOT NULL,
  campus_id bigint NOT NULL,
  nome character varying NOT NULL,
  sigla character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cursos_pkey PRIMARY KEY (id),
  CONSTRAINT cursos_escola_id_fkey FOREIGN KEY (escola_id) REFERENCES public.escolas(id),
  CONSTRAINT cursos_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campi(id)
);

CREATE TABLE public.usuarios (
  id bigint NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  nome character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  matricula character varying NOT NULL UNIQUE,
  tipo_usuario public.tipo_usuario_enum NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

CREATE TABLE public.alunos (
  usuario_id bigint NOT NULL,
  curso_id bigint NOT NULL,
  semestre smallint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alunos_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT alunos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT alunos_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id)
);

CREATE TABLE public.atividades_academicas (
  id bigint NOT NULL DEFAULT nextval('atividades_academicas_id_seq'::regclass),
  aluno_id bigint NOT NULL,
  tipo public.tipo_atividade_enum NOT NULL,
  status public.status_atividade_enum NOT NULL DEFAULT 'Em_Andamento'::public.status_atividade_enum,
  descricao character varying,
  data_inicio date NOT NULL,
  data_fim date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT atividades_academicas_pkey PRIMARY KEY (id),
  CONSTRAINT atividades_academicas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.alunos(usuario_id)
);

CREATE TABLE public.professores (
  usuario_id bigint NOT NULL,
  regime_trabalho character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professores_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT professores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.servidores (
  usuario_id bigint NOT NULL,
  cargo character varying NOT NULL,
  setor_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT servidores_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT servidores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT servidores_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id)
);

CREATE TABLE public.ativos (
  id bigint NOT NULL DEFAULT nextval('ativos_id_seq'::regclass),
  serial_patrimonio character varying NOT NULL UNIQUE,
  nome character varying NOT NULL,
  descricao text,
  especificacao_tecnica text,
  etiquetado boolean NOT NULL DEFAULT false,
  categoria character varying NOT NULL,
  status public.status_ativo_enum NOT NULL DEFAULT 'Novo'::public.status_ativo_enum,
  elegivel_emprestimo boolean NOT NULL DEFAULT false,
  setor_id bigint NOT NULL,
  responsavel_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  imagem_url text,
  storage_key text,
  especificacoes_tecnicas jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ativos_pkey PRIMARY KEY (id),
  CONSTRAINT ativos_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id),
  CONSTRAINT ativos_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(usuario_id)
);

CREATE TABLE public.ativos_ti (
  ativo_id bigint NOT NULL,
  marca character varying NOT NULL,
  memoria_ram_gb smallint,
  armazenamento_gb integer,
  sistema_operacional character varying,
  numero_serie character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ativos_ti_pkey PRIMARY KEY (ativo_id),
  CONSTRAINT ativos_ti_ativo_id_fkey FOREIGN KEY (ativo_id) REFERENCES public.ativos(id)
);

CREATE TABLE public.softwares (
  id bigint NOT NULL DEFAULT nextval('softwares_id_seq'::regclass),
  nome character varying NOT NULL,
  fabricante character varying NOT NULL,
  total_licencas_compradas integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT softwares_pkey PRIMARY KEY (id)
);

CREATE TABLE public.instalacoes_software (
  id bigint NOT NULL DEFAULT nextval('instalacoes_software_id_seq'::regclass),
  software_id bigint NOT NULL,
  ativo_ti_id bigint NOT NULL,
  data_instalacao date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT instalacoes_software_pkey PRIMARY KEY (id),
  CONSTRAINT instalacoes_software_software_id_fkey FOREIGN KEY (software_id) REFERENCES public.softwares(id),
  CONSTRAINT instalacoes_software_ativo_ti_id_fkey FOREIGN KEY (ativo_ti_id) REFERENCES public.ativos_ti(ativo_id)
);

CREATE TABLE public.movimentacoes_ativo (
  id bigint NOT NULL DEFAULT nextval('movimentacoes_ativo_id_seq'::regclass),
  ativo_id bigint NOT NULL,
  operador_id bigint NOT NULL,
  status_anterior public.status_ativo_enum,
  status_novo public.status_ativo_enum NOT NULL,
  setor_id bigint NOT NULL,
  observacao text,
  registrado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT movimentacoes_ativo_pkey PRIMARY KEY (id),
  CONSTRAINT movimentacoes_ativo_ativo_id_fkey FOREIGN KEY (ativo_id) REFERENCES public.ativos(id),
  CONSTRAINT movimentacoes_ativo_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.servidores(usuario_id),
  CONSTRAINT movimentacoes_ativo_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES public.setores(id)
);

CREATE TABLE public.emprestimos (
  id bigint NOT NULL DEFAULT nextval('emprestimos_id_seq'::regclass),
  ativo_id bigint NOT NULL,
  usuario_id bigint NOT NULL,
  autorizado_por_id bigint NOT NULL,
  data_saida timestamp with time zone NOT NULL DEFAULT now(),
  data_devolucao_prevista timestamp with time zone NOT NULL,
  data_devolucao_real timestamp with time zone,
  status_conservacao_retorno public.status_conservacao_enum,
  status public.status_emprestimo_enum NOT NULL DEFAULT 'Ativo'::public.status_emprestimo_enum,
  observacao_saida text,
  observacao_devolucao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT emprestimos_pkey PRIMARY KEY (id),
  CONSTRAINT emprestimos_ativo_id_fkey FOREIGN KEY (ativo_id) REFERENCES public.ativos(id),
  CONSTRAINT emprestimos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT emprestimos_autorizado_por_id_fkey FOREIGN KEY (autorizado_por_id) REFERENCES public.servidores(usuario_id)
);
