from django.db import models
from apps.core.models import TimestampedModel
from apps.usuarios.models import Aluno

class TipoAtividade(models.TextChoices):
    IC = 'Iniciacao_Cientifica', 'Iniciação Científica'
    MONITORIA = 'Monitoria', 'Monitoria'
    ESTAGIO = 'Estagio', 'Estágio'
    EXTENSAO = 'Extensao', 'Extensão'


class StatusAtividade(models.TextChoices):
    EM_ANDAMENTO = 'Em_Andamento', 'Em Andamento'
    CONCLUIDO = 'Concluido', 'Concluído'
    CANCELADO = 'Cancelado', 'Cancelado'


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

    class Meta:
        db_table = 'atividades_academicas'
        verbose_name = 'Atividade Acadêmica'
        verbose_name_plural = 'Atividades Acadêmicas'

    def __str__(self):
        return f"Atividade {self.tipo} - Aluno: {self.aluno.usuario.nome}"
