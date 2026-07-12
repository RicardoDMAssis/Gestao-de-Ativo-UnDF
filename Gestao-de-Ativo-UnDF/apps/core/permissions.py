from rest_framework import permissions
from apps.usuarios.models import TipoUsuario

class IsServidor(permissions.BasePermission):
    """
    Permissão que concede acesso apenas a usuários do tipo Servidor.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return getattr(request.user, 'is_servidor', False)


class IsProfessor(permissions.BasePermission):
    """
    Permissão que concede acesso apenas a usuários do tipo Professor.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'is_professor', False)
        )


class IsAluno(permissions.BasePermission):
    """
    Permissão que concede acesso apenas a usuários do tipo Aluno.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'is_aluno', False)
        )
