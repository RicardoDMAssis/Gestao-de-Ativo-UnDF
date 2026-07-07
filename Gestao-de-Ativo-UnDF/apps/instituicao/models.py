from django.db import models
from apps.core.models import TimestampedModel


class TipoSetor(models.TextChoices):
    # ── Órgãos superiores ─────────────────────────────────────────────────────
    CONSELHOS_SUPERIORES = 'Conselhos_Superiores', 'Conselhos Superiores (CONSUNI/CONSEPE/CADFUnDF)'
    REITORIA = 'Reitoria', 'Reitoria'
    VICE_REITORIA = 'Vice_Reitoria', 'Vice-Reitoria'
    PROCURADORIA_JURIDICA = 'Procuradoria_Juridica', 'Procuradoria Jurídica (PROJUR)'
    CONTROLADORIA_SETORIAL = 'Controladoria_Setorial', 'Controladoria Setorial'
    OUVIDORIA = 'Ouvidoria', 'Ouvidoria'

    # ── Órgãos de apoio direto à Reitoria ────────────────────────────────────
    BIBLIOTECA_CENTRAL = 'Biblioteca_Central', 'Biblioteca Central (BCE)'
    AGENCIA_DE_COMUNICACAO = 'Agencia_de_Comunicacao', 'Agência de Comunicação (ASCOM)'
    SECRETARIA_ACADEMICA_GERAL = 'Secretaria_Academica_Geral', 'Secretaria Acadêmica Geral (SEAG)'
    SECRETARIA_EXECUTIVA = 'Secretaria_Executiva', 'Secretaria Executiva (SECEX)'
    UNIDADE_PLANEJAMENTO_ORCAMENTO_GESTAO = 'Unidade_Planejamento_Orcamento_Gestao', 'Unid. Planejamento, Orçamento e Gestão (UPOG)'
    UNIDADE_ESCRITORIO_DE_NEGOCIOS = 'Unidade_Escritorio_de_Negocios', 'Unidade Escritório de Negócios (UEN)'
    PREFEITURA_UNIVERSITARIA = 'Prefeitura_Universitaria', 'Prefeitura Universitária'

    # ── Pró-Reitorias ─────────────────────────────────────────────────────────
    PRODRS = 'PRODRS', 'Pró-Reitoria de Desenvolvimento Regional e Sustentável'
    PRODUNI = 'PRODUNI', 'Pró-Reitoria de Desenvolvimento Universitário'
    PROEXTC = 'PROEXTC', 'Pró-Reitoria de Extensão e Cultura'
    PROGRAD = 'PROGRAD', 'Pró-Reitoria de Graduação'
    PROPPG = 'PROPPG', 'Pró-Reitoria de Pesquisa e Pós-Graduação'

    # ── Unidade de Administração Geral (UAG) ──────────────────────────────────
    UAG = 'UAG', 'Unidade de Administração Geral'
    UAG_PATRIMONIO = 'UAG_Patrimonio', 'UAG — Diretoria de Patrimônio, Recursos Materiais e Serviços'
    UAG_CONTRATOS = 'UAG_Contratos', 'UAG — Diretoria de Contratos e Convênios'
    UAG_FINANCEIRO = 'UAG_Financeiro', 'UAG — Diretoria de Contabilidade, Orçamento e Finanças'
    UAG_GESTAO_PESSOAS = 'UAG_Gestao_Pessoas', 'UAG — Diretoria de Gestão de Pessoas'
    UAG_COMPRAS = 'UAG_Compras', 'UAG — Diretoria de Gestão de Compras'
    UAG_ARQUIVO = 'UAG_Arquivo', 'UAG — Gerência de Arquivo, Protocolo e Documentos'

    # ── Centros Interdisciplinares ────────────────────────────────────────────
    CEINTER_CIENCIAS_HUMANAS = 'Ceinter_Ciencias_Humanas', 'Ceinter de Ciências Humanas (COCHCMA)'
    CEINTER_EDUCACAO_ARTES = 'Ceinter_Educacao_Artes', 'Ceinter de Educação e Artes (COEMAG)'
    CEINTER_ENGENHARIA_TI = 'Ceinter_Engenharia_TI', 'Ceinter de Engenharia e TI (COETI)'
    CEINTER_CIENCIAS_SAUDE = 'Ceinter_Ciencias_Saude', 'Ceinter de Ciências da Saúde (COCBS)'

    # ── Setores de campus ─────────────────────────────────────────────────────
    TI_CAMPUS = 'TI_Campus', 'TI do Campus (Suporte Técnico Local)'
    SECRETARIA_CAMPUS = 'Secretaria_Campus', 'Secretaria Acadêmica do Campus'
    COORDENACAO_CURSO = 'Coordenacao_Curso', 'Coordenação de Curso'
    LABORATORIO = 'Laboratorio', 'Laboratório Acadêmico'
    BIBLIOTECA_SETORIAL = 'Biblioteca_Setorial', 'Biblioteca Setorial'
    ALMOXARIFADO = 'Almoxarifado', 'Almoxarifado do Campus'


class Escola(TimestampedModel):
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=50, unique=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'escolas'
        verbose_name = 'Escola'
        verbose_name_plural = 'Escolas'

    def __str__(self):
        return f"{self.nome} ({self.sigla})"


class Campus(TimestampedModel):
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=50, unique=True)
    cidade = models.CharField(max_length=255)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'campi'
        verbose_name = 'Campus'
        verbose_name_plural = 'Campi'

    def __str__(self):
        return f"{self.nome} ({self.sigla})"


class Setor(TimestampedModel):
    campus = models.ForeignKey(
        Campus,
        on_delete=models.CASCADE,
        related_name='setores',
        db_column='campus_id'
    )
    tipo = models.CharField(max_length=50, choices=TipoSetor.choices)
    email = models.EmailField(max_length=255, null=True, blank=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'setores'
        verbose_name = 'Setor'
        verbose_name_plural = 'Setores'
        constraints = [
            models.UniqueConstraint(
                fields=['campus', 'tipo'],
                name='uq_setores_campus_tipo'
            )
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.campus.sigla}"


class Curso(TimestampedModel):
    escola = models.ForeignKey(
        Escola,
        on_delete=models.CASCADE,
        related_name='cursos',
        db_column='escola_id'
    )
    campus = models.ForeignKey(
        Campus,
        on_delete=models.CASCADE,
        related_name='cursos',
        db_column='campus_id'
    )
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=50, null=True, blank=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'cursos'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        constraints = [
            models.UniqueConstraint(
                fields=['escola', 'campus', 'nome'],
                name='uq_curso_escola_campus_nome'
            )
        ]

    def __str__(self):
        return f"{self.nome} ({self.sigla or 'S/S'})"


class TipoSala(models.TextChoices):
    SALA = 'Sala', 'Sala'
    LABORATORIO = 'Laboratorio', 'Laboratório'


class Sala(TimestampedModel):
    campus = models.ForeignKey(
        Campus,
        on_delete=models.CASCADE,
        related_name='salas',
        db_column='campus_id'
    )
    numero = models.CharField(max_length=50)  # ex: "Lab 101", "Sala 302"
    tipo = models.CharField(max_length=50, choices=TipoSala.choices)

    class Meta:
        db_table = 'salas'
        verbose_name = 'Sala'
        verbose_name_plural = 'Salas'
        constraints = [
            models.UniqueConstraint(
                fields=['campus', 'numero'],
                name='uq_salas_campus_numero'
            )
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} {self.numero} — {self.campus.sigla}"
