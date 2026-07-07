| tabela                    | ordem | coluna                     | tipo_dado                | aceita_null |
| ------------------------- | ----- | -------------------------- | ------------------------ | ----------- |
| alunos                    | 1     | usuario_id                 | bigint                   | NO          |
| alunos                    | 2     | curso_id                   | bigint                   | NO          |
| alunos                    | 3     | semestre                   | smallint                 | NO          |
| alunos                    | 4     | created_at                 | timestamp with time zone | NO          |
| alunos                    | 5     | updated_at                 | timestamp with time zone | NO          |
| atividades_academicas     | 1     | id                         | bigint                   | NO          |
| atividades_academicas     | 2     | aluno_id                   | bigint                   | NO          |
| atividades_academicas     | 3     | tipo                       | USER-DEFINED             | NO          |
| atividades_academicas     | 4     | status                     | USER-DEFINED             | NO          |
| atividades_academicas     | 5     | descricao                  | character varying        | YES         |
| atividades_academicas     | 6     | data_inicio                | date                     | NO          |
| atividades_academicas     | 7     | data_fim                   | date                     | YES         |
| atividades_academicas     | 8     | created_at                 | timestamp with time zone | NO          |
| atividades_academicas     | 9     | updated_at                 | timestamp with time zone | NO          |
| ativos                    | 1     | id                         | bigint                   | NO          |
| ativos                    | 2     | serial_patrimonio          | character varying        | NO          |
| ativos                    | 3     | nome                       | character varying        | NO          |
| ativos                    | 4     | descricao                  | text                     | YES         |
| ativos                    | 5     | especificacao_tecnica      | text                     | YES         |
| ativos                    | 6     | etiquetado                 | boolean                  | NO          |
| ativos                    | 7     | categoria                  | character varying        | NO          |
| ativos                    | 8     | status                     | USER-DEFINED             | NO          |
| ativos                    | 9     | elegivel_emprestimo        | boolean                  | NO          |
| ativos                    | 10    | setor_id                   | bigint                   | NO          |
| ativos                    | 11    | responsavel_id             | bigint                   | NO          |
| ativos                    | 12    | created_at                 | timestamp with time zone | NO          |
| ativos                    | 13    | updated_at                 | timestamp with time zone | NO          |
| ativos                    | 14    | imagem_url                 | text                     | YES         |
| ativos                    | 15    | storage_key                | text                     | YES         |
| ativos_ti                 | 1     | ativo_id                   | bigint                   | NO          |
| ativos_ti                 | 2     | marca                      | character varying        | NO          |
| ativos_ti                 | 3     | memoria_ram_gb             | smallint                 | YES         |
| ativos_ti                 | 4     | armazenamento_gb           | integer                  | YES         |
| ativos_ti                 | 5     | sistema_operacional        | character varying        | YES         |
| ativos_ti                 | 6     | numero_serie               | character varying        | YES         |
| ativos_ti                 | 7     | created_at                 | timestamp with time zone | NO          |
| auth_group                | 1     | id                         | integer                  | NO          |
| auth_group                | 2     | name                       | character varying        | NO          |
| auth_group_permissions    | 1     | id                         | bigint                   | NO          |
| auth_group_permissions    | 2     | group_id                   | integer                  | NO          |
| auth_group_permissions    | 3     | permission_id              | integer                  | NO          |
| auth_permission           | 1     | id                         | integer                  | NO          |
| auth_permission           | 2     | name                       | character varying        | NO          |
| auth_permission           | 3     | content_type_id            | integer                  | NO          |
| auth_permission           | 4     | codename                   | character varying        | NO          |
| campi                     | 1     | id                         | bigint                   | NO          |
| campi                     | 2     | nome                       | character varying        | NO          |
| campi                     | 3     | sigla                      | character varying        | NO          |
| campi                     | 4     | cidade                     | character varying        | NO          |
| campi                     | 5     | created_at                 | timestamp with time zone | NO          |
| campi                     | 6     | updated_at                 | timestamp with time zone | NO          |
| campi                     | 7     | ativo                      | boolean                  | NO          |
| cursos                    | 1     | id                         | bigint                   | NO          |
| cursos                    | 2     | escola_id                  | bigint                   | NO          |
| cursos                    | 3     | campus_id                  | bigint                   | NO          |
| cursos                    | 4     | nome                       | character varying        | NO          |
| cursos                    | 5     | sigla                      | character varying        | YES         |
| cursos                    | 6     | created_at                 | timestamp with time zone | NO          |
| cursos                    | 7     | updated_at                 | timestamp with time zone | NO          |
| cursos                    | 8     | ativo                      | boolean                  | NO          |
| django_admin_log          | 1     | id                         | integer                  | NO          |
| django_admin_log          | 2     | action_time                | timestamp with time zone | NO          |
| django_admin_log          | 3     | object_id                  | text                     | YES         |
| django_admin_log          | 4     | object_repr                | character varying        | NO          |
| django_admin_log          | 5     | action_flag                | smallint                 | NO          |
| django_admin_log          | 6     | change_message             | text                     | NO          |
| django_admin_log          | 7     | content_type_id            | integer                  | YES         |
| django_admin_log          | 8     | user_id                    | bigint                   | NO          |
| django_content_type       | 1     | id                         | integer                  | NO          |
| django_content_type       | 3     | app_label                  | character varying        | NO          |
| django_content_type       | 4     | model                      | character varying        | NO          |
| django_migrations         | 1     | id                         | bigint                   | NO          |
| django_migrations         | 2     | app                        | character varying        | NO          |
| django_migrations         | 3     | name                       | character varying        | NO          |
| django_migrations         | 4     | applied                    | timestamp with time zone | NO          |
| django_session            | 1     | session_key                | character varying        | NO          |
| django_session            | 2     | session_data               | text                     | NO          |
| django_session            | 3     | expire_date                | timestamp with time zone | NO          |
| emprestimos               | 1     | id                         | bigint                   | NO          |
| emprestimos               | 2     | ativo_id                   | bigint                   | NO          |
| emprestimos               | 3     | usuario_id                 | bigint                   | NO          |
| emprestimos               | 4     | autorizado_por_id          | bigint                   | NO          |
| emprestimos               | 5     | data_saida                 | timestamp with time zone | NO          |
| emprestimos               | 6     | data_devolucao_prevista    | timestamp with time zone | NO          |
| emprestimos               | 7     | data_devolucao_real        | timestamp with time zone | YES         |
| emprestimos               | 8     | status_conservacao_retorno | USER-DEFINED             | YES         |
| emprestimos               | 9     | status                     | USER-DEFINED             | NO          |
| emprestimos               | 10    | observacao_saida           | text                     | YES         |
| emprestimos               | 11    | observacao_devolucao       | text                     | YES         |
| emprestimos               | 12    | created_at                 | timestamp with time zone | NO          |
| emprestimos               | 13    | updated_at                 | timestamp with time zone | NO          |
| escolas                   | 1     | id                         | bigint                   | NO          |
| escolas                   | 2     | nome                       | character varying        | NO          |
| escolas                   | 3     | sigla                      | character varying        | NO          |
| escolas                   | 4     | created_at                 | timestamp with time zone | NO          |
| escolas                   | 5     | updated_at                 | timestamp with time zone | NO          |
| escolas                   | 6     | ativo                      | boolean                  | NO          |
| instalacoes_software      | 1     | id                         | bigint                   | NO          |
| instalacoes_software      | 2     | software_id                | bigint                   | NO          |
| instalacoes_software      | 3     | ativo_ti_id                | bigint                   | NO          |
| instalacoes_software      | 4     | data_instalacao            | date                     | NO          |
| instalacoes_software      | 5     | created_at                 | timestamp with time zone | NO          |
| movimentacoes_ativo       | 1     | id                         | bigint                   | NO          |
| movimentacoes_ativo       | 2     | ativo_id                   | bigint                   | NO          |
| movimentacoes_ativo       | 3     | operador_id                | bigint                   | NO          |
| movimentacoes_ativo       | 4     | status_anterior            | USER-DEFINED             | YES         |
| movimentacoes_ativo       | 5     | status_novo                | USER-DEFINED             | NO          |
| movimentacoes_ativo       | 6     | setor_id                   | bigint                   | NO          |
| movimentacoes_ativo       | 7     | observacao                 | text                     | YES         |
| movimentacoes_ativo       | 8     | registrado_em              | timestamp with time zone | NO          |
| professores               | 1     | usuario_id                 | bigint                   | NO          |
| professores               | 2     | regime_trabalho            | character varying        | NO          |
| professores               | 3     | created_at                 | timestamp with time zone | NO          |
| professores               | 4     | updated_at                 | timestamp with time zone | NO          |
| servidores                | 1     | usuario_id                 | bigint                   | NO          |
| servidores                | 2     | cargo                      | character varying        | NO          |
| servidores                | 3     | setor_id                   | bigint                   | NO          |
| servidores                | 4     | created_at                 | timestamp with time zone | NO          |
| servidores                | 5     | updated_at                 | timestamp with time zone | NO          |
| setores                   | 1     | id                         | bigint                   | NO          |
| setores                   | 2     | campus_id                  | bigint                   | NO          |
| setores                   | 3     | tipo                       | USER-DEFINED             | NO          |
| setores                   | 4     | email                      | character varying        | YES         |
| setores                   | 5     | created_at                 | timestamp with time zone | NO          |
| setores                   | 6     | updated_at                 | timestamp with time zone | NO          |
| setores                   | 7     | ativo                      | boolean                  | NO          |
| softwares                 | 1     | id                         | bigint                   | NO          |
| softwares                 | 2     | nome                       | character varying        | NO          |
| softwares                 | 3     | fabricante                 | character varying        | NO          |
| softwares                 | 4     | total_licencas_compradas   | integer                  | NO          |
| softwares                 | 5     | created_at                 | timestamp with time zone | NO          |
| softwares                 | 6     | updated_at                 | timestamp with time zone | NO          |
| usuarios                  | 1     | id                         | bigint                   | NO          |
| usuarios                  | 2     | nome                       | character varying        | NO          |
| usuarios                  | 3     | email                      | character varying        | NO          |
| usuarios                  | 4     | matricula                  | character varying        | NO          |
| usuarios                  | 5     | tipo_usuario               | USER-DEFINED             | NO          |
| usuarios                  | 6     | ativo                      | boolean                  | NO          |
| usuarios                  | 7     | created_at                 | timestamp with time zone | NO          |
| usuarios                  | 8     | updated_at                 | timestamp with time zone | NO          |
| usuarios                  | 9     | password                   | character varying        | YES         |
| usuarios                  | 10    | last_login                 | timestamp with time zone | YES         |
| usuarios                  | 11    | is_superuser               | boolean                  | NO          |
| usuarios                  | 12    | is_staff                   | boolean                  | NO          |
| usuarios                  | 13    | is_active                  | boolean                  | NO          |
| usuarios_groups           | 1     | id                         | bigint                   | NO          |
| usuarios_groups           | 2     | usuario_id                 | bigint                   | NO          |
| usuarios_groups           | 3     | group_id                   | integer                  | NO          |
| usuarios_user_permissions | 1     | id                         | bigint                   | NO          |
| usuarios_user_permissions | 2     | usuario_id                 | bigint                   | NO          |
| usuarios_user_permissions | 3     | permission_id              | integer                  | NO          |
