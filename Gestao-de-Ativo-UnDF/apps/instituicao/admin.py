from django.contrib import admin
from apps.instituicao.models import Escola, Campus, Setor, Curso

@admin.register(Escola)
class EscolaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'sigla', 'created_at')
    search_fields = ('nome', 'sigla')

@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'sigla', 'cidade', 'created_at')
    search_fields = ('nome', 'sigla', 'cidade')

@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = ('id', 'campus', 'tipo', 'email', 'created_at')
    list_filter = ('tipo', 'campus')
    search_fields = ('email', 'campus__nome')

@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'sigla', 'escola', 'campus', 'created_at')
    list_filter = ('escola', 'campus')
    search_fields = ('nome', 'sigla')
