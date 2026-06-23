from django.db import models
from apps.core.models import TimestampedModel
from apps.ativos.models import Ativo
from apps.usuarios.models import Usuario, Servidor

class StatusConservacao(models.TextChoices):
    EXCELENTE = 'Excelente', 'Excelente'
    BOM = 'Bom', 'Bom'
    REGULAR = 'Regular', 'Regular'
    DANIFICADO = 'Danificado', 'Danificado'


class StatusEmprestimo(models.TextChoices):
    ATIVO = 'Ativo', 'Ativo'
    DEVOLVIDO = 'Devolvido', 'Devolvido'
    ATRASADO = 'Atrasado', 'Atrasado'
    CANCELADO = 'Cancelado', 'Cancelado'


class Emprestimo(TimestampedModel):
    ativo = models.ForeignKey(
        Ativo,
        on_delete=models.PROTECT,
        db_column='ativo_id',
        related_name='emprestimos'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        db_column='usuario_id',
        related_name='emprestimos_solicitados'
    )
    autorizado_por = models.ForeignKey(
        Servidor,
        on_delete=models.PROTECT,
        db_column='autorizado_por_id',
        related_name='emprestimos_autorizados'
    )
    data_saida = models.DateTimeField(auto_now_add=True)
    data_devolucao_prevista = models.DateTimeField()
    data_devolucao_real = models.DateTimeField(null=True, blank=True)
    status_conservacao_retorno = models.CharField(
        max_length=50,
        choices=StatusConservacao.choices,
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=50,
        choices=StatusEmprestimo.choices,
        default=StatusEmprestimo.ATIVO
    )
    observacao_saida = models.TextField(null=True, blank=True)
    observacao_devolucao = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'emprestimos'
        verbose_name = 'Empréstimo'
        verbose_name_plural = 'Empréstimos'

    def __str__(self):
        return f"Empréstimo {self.id} - Ativo: {self.ativo.serial_patrimonio} - Status: {self.status}"
