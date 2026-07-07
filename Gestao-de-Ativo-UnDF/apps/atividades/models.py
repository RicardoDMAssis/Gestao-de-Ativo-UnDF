from django.db import models
from apps.core.models import TimestampedModel
from apps.usuarios.models import Aluno


class TipoAtividade(models.TextChoices):
    # Valores alinhados com o DBML (tipo_atividade_academica_enum)
    ESTAGIO_OBRIGATORIO = 'Estagio_Obrigatorio', 'Estágio Obrigatório'
    ESTAGIO_NAO_OBRIGATORIO = 'Estagio_Nao_Obrigatorio', 'Estágio Não Obrigatório'
    PIBIC = 'PIBIC', 'PIBIC — Programa Institucional de Bolsas de Iniciação Científica'
    PIVIC = 'PIVIC', 'PIVIC — Programa de Iniciação Científica Voluntária'
    EXTENSAO = 'Extensao', 'Extensão'
    MONITORIA = 'Monitoria', 'Monitoria'
    TRABALHO_ACADEMICO = 'Trabalho_Academico', 'Trabalho Acadêmico'
    PIBID = 'PIBID', 'PIBID — Programa Institucional de Bolsa de Iniciação à Docência'
    EMPRESA_JUNIOR = 'Empresa_Junior', 'Empresa Júnior'
    PUBLICACAO_CIENTIFICA = 'Publicacao_Cientifica', 'Publicação Científica'
    ORGANIZACAO_EVENTO = 'Organizacao_Evento', 'Organização de Evento'
    ATIVIDADE_CULTURAL_ESPORTIVA = 'Atividade_Cultural_Esportiva', 'Atividade Cultural/Esportiva'


class StatusAtividade(models.TextChoices):
    EM_ANDAMENTO = 'Em_Andamento', 'Em Andamento'
    CONCLUIDA = 'Concluida', 'Concluída'
    CANCELADA = 'Cancelada', 'Cancelada'


class AtividadeAcademica(TimestampedModel):
    aluno = models.ForeignKey(
        Aluno,
        on_delete=models.CASCADE,
        db_column='aluno_id',
        related_name='atividades_academicas'
    )
    tipo = models.CharField(max_length=50, choices=TipoAtividade.choices)
    status = models.CharField(
        max_length=50,
        choices=StatusAtividade.choices,
        default=StatusAtividade.EM_ANDAMENTO
    )
    descricao = models.CharField(max_length=255, null=True, blank=True)
    data_inicio = models.DateField()
    data_fim = models.DateField(null=True, blank=True)
    numero_processo = models.CharField(max_length=100, null=True, blank=True)
    aprovada = models.BooleanField(default=False)

    class Meta:
        db_table = 'atividades_academicas'
        verbose_name = 'Atividade Acadêmica'
        verbose_name_plural = 'Atividades Acadêmicas'

    def __str__(self):
        return f"Atividade {self.get_tipo_display()} — Aluno: {self.aluno.usuario.nome}"
