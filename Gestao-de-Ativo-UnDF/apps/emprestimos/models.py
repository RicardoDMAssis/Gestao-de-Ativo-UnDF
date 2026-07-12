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
    # Alinhado com o DBML (status_emprestimo_enum)
    PENDENTE = 'Pendente', 'Pendente'
    ATIVO = 'Ativo', 'Ativo'
    CONCLUIDO = 'Concluido', 'Concluído'   # era Devolvido — alinhado com DBML
    ATRASADO = 'Atrasado', 'Atrasado'
    FINALIZADO = 'Finalizado', 'Finalizado'


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
        related_name='emprestimos_autorizados',
        null=True,
        blank=True
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
        default=StatusEmprestimo.PENDENTE
    )
    observacao_saida = models.TextField(null=True, blank=True)
    observacao_devolucao = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'emprestimos'
        verbose_name = 'Empréstimo'
        verbose_name_plural = 'Empréstimos'

    def __str__(self):
        return f"Empréstimo {self.id} - Ativo: {self.ativo.serial_patrimonio} - Status: {self.status}"


class FilaEmprestimo(TimestampedModel):
    ativo = models.ForeignKey(
        Ativo,
        on_delete=models.CASCADE,
        db_column='ativo_id',
        related_name='fila_espera'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column='usuario_id',
        related_name='filas_espera'
    )

    class Meta:
        db_table = 'filas_emprestimo'
        ordering = ['created_at']
        verbose_name = 'Fila de Empréstimo'
        verbose_name_plural = 'Filas de Empréstimo'
        constraints = [
            models.UniqueConstraint(
                fields=['ativo', 'usuario'],
                name='uq_fila_ativo_usuario'
            )
        ]

    def __str__(self):
        return f"Fila do Ativo {self.ativo.serial_patrimonio} - Usuário: {self.usuario.nome}"
