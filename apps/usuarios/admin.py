from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.usuarios.models import Usuario, Aluno, Professor, Servidor

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('id', 'nome', 'email', 'matricula', 'tipo_usuario', 'ativo', 'is_staff')
    list_filter = ('tipo_usuario', 'ativo', 'is_staff')
    search_fields = ('nome', 'email', 'matricula')
    ordering = ('nome',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('nome', 'matricula', 'tipo_usuario', 'ativo')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'matricula', 'nome', 'tipo_usuario', 'password1', 'password2'),
        }),
    )

@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'curso', 'semestre', 'created_at')
    list_filter = ('curso', 'semestre')
    search_fields = ('usuario__nome', 'usuario__matricula', 'curso__nome')

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'regime_trabalho', 'created_at')
    search_fields = ('usuario__nome', 'usuario__matricula')

@admin.register(Servidor)
class ServidorAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'cargo', 'setor', 'created_at')
    list_filter = ('setor',)
    search_fields = ('usuario__nome', 'usuario__matricula', 'cargo')
