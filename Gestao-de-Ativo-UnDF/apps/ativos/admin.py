from django.contrib import admin
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, MovimentacaoAtivo

@admin.register(Ativo)
class AtivoAdmin(admin.ModelAdmin):
    list_display = ('id', 'serial_patrimonio', 'nome', 'categoria', 'status', 'elegivel_emprestimo', 'setor', 'responsavel')
    list_filter = ('status', 'elegivel_emprestimo', 'categoria', 'setor')
    search_fields = ('nome', 'serial_patrimonio', 'descricao')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AtivoTI)
class AtivoTIAdmin(admin.ModelAdmin):
    list_display = ('ativo', 'marca', 'memoria_ram_gb', 'armazenamento_gb', 'sistema_operacional')
    list_filter = ('marca', 'sistema_operacional')
    search_fields = ('ativo__nome', 'marca', 'numero_serie')

@admin.register(Software)
class SoftwareAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'fabricante', 'total_licencas_compradas', 'created_at')
    search_fields = ('nome', 'fabricante')

@admin.register(InstalacaoSoftware)
class InstalacaoSoftwareAdmin(admin.ModelAdmin):
    list_display = ('id', 'software', 'ativo_ti', 'data_instalacao')
    list_filter = ('software',)
    search_fields = ('software__nome', 'ativo_ti__ativo__nome')

@admin.register(MovimentacaoAtivo)
class MovimentacaoAtivoAdmin(admin.ModelAdmin):
    list_display = ('id', 'ativo', 'operador', 'status_anterior', 'status_novo', 'setor', 'registrado_em')
    list_filter = ('status_novo', 'setor')
    search_fields = ('ativo__nome', 'ativo__serial_patrimonio', 'operador__usuario__nome')
    readonly_fields = ('registrado_em',)
