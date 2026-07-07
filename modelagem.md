// ============================================================================
// SGP — Sistema de Gestão de Patrimônio · UnDF
// DBML v3 · Junho 2026
// ============================================================================

// ============================================================================
// 1. ENUMS
// ============================================================================

Enum tipo_usuario_enum {
Aluno
Professor
Servidor
}

// Setores reais da UnDF extraídos do organograma oficial.
// Modelado como enum extensível: novos valores são adicionados via ALTER TYPE
// sem necessidade de recriar a tabela.
Enum tipo_setor_enum {
// Órgãos superiores
Conselhos_Superiores // CONSUNI, CONSEPE, CADFUnDF
Reitoria
Vice_Reitoria
Procuradoria_Juridica // PROJUR
Controladoria_Setorial
Ouvidoria

// Órgãos de apoio direto à Reitoria
Biblioteca_Central // BCE
Agencia_de_Comunicacao // ASCOM
Secretaria_Academica_Geral // SEAG
Secretaria_Executiva // SECEX
Unidade_Planejamento_Orcamento_Gestao // UPOG
Unidade_Escritorio_de_Negocios // UEN
Prefeitura_Universitaria

// Pró-Reitorias
PRODRS // Pró-Reitoria de Desenvolvimento Regional e Sustentável
PRODUNI // Pró-Reitoria de Desenvolvimento Universitário (TI, Assistência Estudantil, Pessoas)
PROEXTC // Pró-Reitoria de Extensão e Cultura
PROGRAD // Pró-Reitoria de Graduação
PROPPG // Pró-Reitoria de Pesquisa e Pós-Graduação

// Unidade de Administração Geral e suas diretorias (custódia de patrimônio)
UAG // Unidade de Administração Geral (raiz)
UAG_Patrimonio // Diretoria de Patrimônio, Recursos Materiais e Serviços
UAG_Contratos // Diretoria de Contratos e Convênios
UAG_Financeiro // Diretoria de Contabilidade, Orçamento e Finanças
UAG_Gestao_Pessoas // Diretoria de Gestão de Pessoas
UAG_Compras // Diretoria de Gestão de Compras
UAG_Arquivo // Gerência de Arquivo, Protocolo e Documentos Administrativos

// Centros Interdisciplinares
Ceinter_Ciencias_Humanas // COCHCMA
Ceinter_Educacao_Artes // COEMAG
Ceinter_Engenharia_TI // COETI
Ceinter_Ciencias_Saude // COCBS

// Setores de campus (replicados por campus via tabela setores)
TI_Campus // Suporte técnico local de TI no campus
Secretaria_Campus // Secretaria acadêmica setorial do campus
Coordenacao_Curso // Coordenação de curso específico
Laboratorio // Laboratório de uso acadêmico
Biblioteca_Setorial // Biblioteca setorial do campus
Almoxarifado // Almoxarifado do campus
}

Enum tipo_atividade_academica_enum {
Estagio_Obrigatorio
Estagio_Nao_Obrigatorio
PIBIC
PIVIC
Extensao
Monitoria
Trabalho_Academico
PIBID
Empresa_Junior
Publicacao_Cientifica
Organizacao_Evento
Atividade_Cultural_Esportiva
}

Enum status_atividade_enum {
Em_Andamento
Concluida
Cancelada
}

Enum status_ativo_enum {
Novo
Avariado
Desempossado
Emprestado
}

Enum status_emprestimo_enum {
Ativo
Concluido
Atrasado
}

// ============================================================================
// 2. TOPOLOGIA
// ============================================================================

Table escolas {
id bigserial [pk]
nome varchar(255) [not null]
sigla varchar(20) [not null, unique]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table campi {
id bigserial [pk]
nome varchar(255) [not null]
sigla varchar(20) [not null, unique]
cidade varchar(100) [not null]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table setores {
id bigserial [pk]
campus_id bigint [not null, ref: > campi.id]
tipo tipo_setor_enum [not null]
email varchar(255)
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]

indexes {
(campus_id, tipo) [unique, name: "uq_setores_campus_tipo"]
}
}

Table cursos {
id bigserial [pk]
escola_id bigint [not null, ref: > escolas.id]
campus_id bigint [not null, ref: > campi.id]
nome varchar(255) [not null]
sigla varchar(30)
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]

indexes {
(escola_id, campus_id, nome) [unique, name: "uq_curso_escola_campus_nome"]
}
}

// ============================================================================
// 3. IDENTIDADES — padrão TPT (Table Per Type)
// ============================================================================

Table usuarios {
id bigserial [pk]
nome varchar(255) [not null]
email varchar(255) [not null, unique]
matricula varchar(20) [not null, unique]
tipo_usuario tipo_usuario_enum [not null]
ativo boolean [not null, default: true]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table alunos {
usuario_id bigint [pk, ref: - usuarios.id]
curso_id bigint [not null, ref: > cursos.id]
semestre smallint [not null]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table atividades_academicas {
id bigserial [pk]
aluno_id bigint [not null, ref: > alunos.usuario_id]
tipo tipo_atividade_academica_enum [not null]
status status_atividade_enum [not null, default: `Em_Andamento`]
descricao varchar(255)
data_inicio date [not null]
data_fim date
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table professores {
usuario_id bigint [pk, ref: - usuarios.id]
regime_trabalho varchar(10) [not null]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table servidores {
usuario_id bigint [pk, ref: - usuarios.id]
cargo varchar(150) [not null]
setor_id bigint [not null, ref: > setores.id]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

// ============================================================================
// 4. GESTÃO DE ATIVOS PATRIMONIAIS
// ============================================================================
Table ativos {
id bigserial [pk]
serial_patrimonio varchar(50) [not null, unique]
nome varchar(255) [not null]
descricao text
especificacao_tecnica text // Adicionado para absorver dados de música/pesquisa
etiquetado boolean [not null, default: false]
categoria varchar(150) [not null]
status status_ativo_enum [not null, default: `Novo`]
elegivel_emprestimo boolean [not null, default: false]
setor_id bigint [not null, ref: > setores.id]
responsavel_id bigint [not null, ref: > servidores.usuario_id]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}

Table ativos_ti {
ativo_id bigint [pk, ref: - ativos.id]
marca varchar(100) [not null]
memoria_ram_gb smallint [not null]
armazenamento_gb int [not null]
sistema_operacional varchar(60) [not null]
numero_serie varchar(100)
created_at timestamptz [not null, default: `now()`]
}

// ============================================================================
// 5. MÓDULO SAM — Software Asset Management
// ============================================================================

Table softwares {
id bigserial [pk]
nome varchar(255) [not null]
fabricante varchar(255) [not null]
total_licencas_compradas int [not null, default: 0]
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]

indexes {
(nome, fabricante) [unique, name: "uq_software_nome_fabricante"]
}
}

Table instalacoes_software {
id bigserial [pk]
software_id bigint [not null, ref: > softwares.id]
ativo_ti_id bigint [not null, ref: > ativos_ti.ativo_id]
data_instalacao date [not null, default: `current_date`]
created_at timestamptz [not null, default: `now()`]

indexes {
(software_id, ativo_ti_id) [unique, name: "uq_instalacao_software_ativo"]
}
}

// ============================================================================
// 6. HISTÓRICO DE MOVIMENTAÇÕES
// ============================================================================

Table movimentacoes_ativo {
id bigserial [pk]
ativo_id bigint [not null, ref: > ativos.id]
operador_id bigint [not null, ref: > servidores.usuario_id]
status_anterior status_ativo_enum
status_novo status_ativo_enum [not null]
setor_id bigint [not null, ref: > setores.id]
observacao text
registrado_em timestamptz [not null, default: `now()`]
}

// ============================================================================
// 7. EMPRÉSTIMOS
// ============================================================================

Table emprestimos {
id bigserial [pk]
ativo_id bigint [not null, ref: > ativos.id]
usuario_id bigint [not null, ref: > usuarios.id]
autorizado_por_id bigint [not null, ref: > servidores.usuario_id]
data_saida timestamptz [not null, default: `now()`]
data_devolucao_prevista timestamptz [not null]
data_devolucao_real timestamptz
status_conservacao_retorno status_ativo_enum
status status_emprestimo_enum [not null, default: `Ativo`]
observacao_saida text
observacao_devolucao text
created_at timestamptz [not null, default: `now()`]
updated_at timestamptz [not null, default: `now()`]
}
