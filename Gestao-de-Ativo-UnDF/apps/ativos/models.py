from django.db import models
from apps.core.models import TimestampedModel
from apps.core.exceptions import BusinessValidationError
from apps.instituicao.models import Setor
from apps.usuarios.models import Servidor


class StatusAtivo(models.TextChoices):
    NOVO = 'Novo', 'Novo'
    AVARIADO = 'Avariado', 'Avariado'
    DESEMPOSSADO = 'Desempossado', 'Desempossado'


class Ativo(TimestampedModel):
    serial_patrimonio = models.CharField(max_length=100, unique=True)
    nome = models.CharField(max_length=255)
    descricao = models.TextField(null=True, blank=True)
    especificacao_tecnica = models.TextField(null=True, blank=True)  # Conforme DBML
    etiquetado = models.BooleanField(default=False)
    categoria = models.CharField(max_length=100)  # Ex: Mobiliário, Computador, Veículo
    status = models.CharField(
        max_length=50,
        choices=StatusAtivo.choices,
        default=StatusAtivo.NOVO
    )
    emprestado = models.BooleanField(default=False)
    elegivel_emprestimo = models.BooleanField(default=False)
    setor = models.ForeignKey(
        Setor,
        on_delete=models.PROTECT,
        db_column='setor_id',
        related_name='ativos'
    )
    responsavel = models.ForeignKey(
        Servidor,
        on_delete=models.PROTECT,
        db_column='responsavel_id',
        related_name='ativos_responsaveis'
    )
    # Campos de imagem — gerenciados exclusivamente via endpoint /upload_imagem/
    # Não devem ser escritos diretamente por serializers de CRUD.
    imagem_url = models.TextField(null=True, blank=True)
    storage_key = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'ativos'
        verbose_name = 'Ativo'
        verbose_name_plural = 'Ativos'

    def __str__(self):
        return f"{self.nome} - Patrimônio: {self.serial_patrimonio}"


class AtivoTI(models.Model):
    # Relacionamento OneToOne atuando como PK/FK para herança (TPT)
    ativo = models.OneToOneField(
        Ativo,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='ativo_id',
        related_name='ti_profile'
    )
    marca = models.CharField(max_length=100)
    memoria_ram_gb = models.SmallIntegerField(null=True, blank=True)
    armazenamento_gb = models.IntegerField(null=True, blank=True)
    sistema_operacional = models.CharField(max_length=150, null=True, blank=True)
    numero_serie = models.CharField(max_length=150, null=True, blank=True)
    sala = models.ForeignKey(
        'instituicao.Sala',
        on_delete=models.SET_NULL,
        db_column='sala_id',
        related_name='ativos_ti',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ativos_ti'
        verbose_name = 'Ativo de TI'
        verbose_name_plural = 'Ativos de TI'

    def __str__(self):
        return f"Ativo TI: {self.ativo.nome} - Marca: {self.marca}"


class Software(TimestampedModel):
    nome = models.CharField(max_length=255)
    fabricante = models.CharField(max_length=255)
    total_licencas_compradas = models.IntegerField(default=0)
    imagem_url = models.TextField(null=True, blank=True)
    storage_key = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'softwares'
        verbose_name = 'Software'
        verbose_name_plural = 'Softwares'
        constraints = [
            models.UniqueConstraint(
                fields=['nome', 'fabricante'],
                name='uq_software_nome_fabricante'
            )
        ]

    def __str__(self):
        return f"{self.nome} ({self.fabricante})"


class InstalacaoSoftware(models.Model):
    software = models.ForeignKey(
        Software,
        on_delete=models.CASCADE,
        db_column='software_id',
        related_name='instalacoes'
    )
    ativo_ti = models.ForeignKey(
        AtivoTI,
        on_delete=models.CASCADE,
        db_column='ativo_ti_id',
        related_name='instalacoes_software'
    )
    data_instalacao = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'instalacoes_software'
        verbose_name = 'Instalação de Software'
        verbose_name_plural = 'Instalações de Softwares'
        constraints = [
            models.UniqueConstraint(
                fields=['software', 'ativo_ti'],
                name='uq_instalacao_software_ativo'
            )
        ]

    def __str__(self):
        return f"Instalação: {self.software.nome} em {self.ativo_ti.ativo.nome}"


class MovimentacaoAtivo(models.Model):
    ativo = models.ForeignKey(
        Ativo,
        on_delete=models.CASCADE,
        db_column='ativo_id',
        related_name='movimentacoes'
    )
    operador = models.ForeignKey(
        Servidor,
        on_delete=models.PROTECT,
        db_column='operador_id',
        related_name='movimentacoes_operadas'
    )
    status_anterior = models.CharField(
        max_length=50,
        choices=StatusAtivo.choices,
        null=True,
        blank=True
    )
    status_novo = models.CharField(
        max_length=50,
        choices=StatusAtivo.choices
    )
    setor = models.ForeignKey(
        Setor,
        on_delete=models.PROTECT,
        db_column='setor_id',
        related_name='movimentacoes_recebidas'
    )
    observacao = models.TextField(null=True, blank=True)
    registrado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movimentacoes_ativo'
        verbose_name = 'Movimentação de Ativo'
        verbose_name_plural = 'Movimentações de Ativos'

    def __str__(self):
        return f"Movimentação do Ativo {self.ativo.serial_patrimonio} para Setor {self.setor}"

    def save(self, *args, **kwargs):
        if self.pk:
            raise BusinessValidationError("Movimentações de ativos são imutáveis (Append-Only). Não é permitido alterá-las após a criação.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise BusinessValidationError("A exclusão de movimentações de ativos não é permitida por questões de auditoria.")


class StatusSolicitacaoInstalacao(models.TextChoices):
    PENDENTE = 'Pendente', 'Pendente'
    APROVADA = 'Aprovada', 'Aprovada'
    REJEITADA = 'Rejeitada', 'Rejeitada'


class SolicitacaoInstalacao(TimestampedModel):
    software = models.ForeignKey(
        Software,
        on_delete=models.CASCADE,
        db_column='software_id',
        related_name='solicitacoes_instalacao'
    )
    solicitante = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.PROTECT,
        db_column='solicitante_id',
        related_name='solicitacoes_instalacao'
    )
    sala = models.ForeignKey(
        'instituicao.Sala',
        on_delete=models.SET_NULL,
        db_column='sala_id',
        related_name='solicitacoes_instalacao',
        null=True,
        blank=True
    )
    ativo_ti = models.ForeignKey(
        AtivoTI,
        on_delete=models.SET_NULL,
        db_column='ativo_ti_id',
        related_name='solicitacoes_instalacao',
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=30,
        choices=StatusSolicitacaoInstalacao.choices,
        default=StatusSolicitacaoInstalacao.PENDENTE
    )
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'solicitacoes_instalacao'
        verbose_name = 'Solicitação de Instalação'
        verbose_name_plural = 'Solicitações de Instalações'

    def clean(self):
        super().clean()
        if not self.sala and not self.ativo_ti:
            raise BusinessValidationError("A solicitação deve especificar um computador individual ou um laboratório (sala) completo.")
        if self.sala and self.ativo_ti:
            raise BusinessValidationError("A solicitação não pode especificar simultaneamente um computador individual e um laboratório completo.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        dest = f"Sala {self.sala.numero}" if self.sala else f"Ativo TI {self.ativo_ti.ativo.serial_patrimonio}"
        return f"Solicitação: {self.software.nome} para {dest} (Status: {self.status})"
