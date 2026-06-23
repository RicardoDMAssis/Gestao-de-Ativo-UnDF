from django.db import models
from apps.core.models import TimestampedModel

class Escola(TimestampedModel):
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=50, unique=True)

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

    class Meta:
        db_table = 'campi'
        verbose_name = 'Campus'
        verbose_name_plural = 'Campi'

    def __str__(self):
        return f"{self.nome} ({self.sigla})"


class TipoSetor(models.TextChoices):
    ADMINISTRATIVO = 'Administrativo', 'Administrativo'
    ACADEMICO = 'Academico', 'Academico'
    OUTRO = 'Outro', 'Outro'


class Setor(TimestampedModel):
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='setores', db_column='campus_id')
    tipo = models.CharField(max_length=50, choices=TipoSetor.choices)
    email = models.EmailField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'setores'
        verbose_name = 'Setor'
        verbose_name_plural = 'Setores'

    def __str__(self):
        return f"Setor {self.tipo} - {self.campus.sigla}"


class Curso(TimestampedModel):
    escola = models.ForeignKey(Escola, on_delete=models.CASCADE, related_name='cursos', db_column='escola_id')
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='cursos', db_column='campus_id')
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'cursos'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'

    def __str__(self):
        return f"{self.nome} ({self.sigla or 'S/S'})"
