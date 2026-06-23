from django.contrib import admin
from apps.emprestimos.models import Emprestimo

@admin.register(Emprestimo)
class EmprestimoAdmin(admin.ModelAdmin):
    list_display = ('id', 'ativo', 'usuario', 'autorizado_por', 'data_saida', 'data_devolucao_prevista', 'data_devolucao_real', 'status')
    list_filter = ('status', 'status_conservacao_retorno')
    search_fields = ('ativo__nome', 'ativo__serial_patrimonio', 'usuario__nome', 'usuario__matricula')
    readonly_fields = ('data_saida', 'created_at', 'updated_at')
