from django.contrib import admin
from apps.atividades.models import AtividadeAcademica

@admin.register(AtividadeAcademica)
class AtividadeAcademicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'aluno', 'tipo', 'status', 'data_inicio', 'data_fim')
    list_filter = ('tipo', 'status')
    search_fields = ('aluno__usuario__nome', 'aluno__usuario__matricula', 'descricao')
    readonly_fields = ('created_at', 'updated_at')
