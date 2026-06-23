from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor, IsProfessor, IsAluno
from apps.atividades.models import AtividadeAcademica
from apps.atividades.serializers import (
    AtividadeAcademicaSerializer,
    AtividadeAcademicaCreateUpdateSerializer
)

class AtividadeAcademicaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo', 'status', 'aluno']
    search_fields = ['descricao', 'aluno__usuario__nome', 'aluno__usuario__matricula']

    def get_queryset(self):
        user = self.request.user

        # Guard para o drf-spectacular e usuários não autenticados
        if not user or not user.is_authenticated:
            return AtividadeAcademica.objects.none()

        # Se for Servidor ou Professor, vê todas as atividades acadêmicas
        if getattr(user, 'is_servidor', False) or getattr(user, 'is_professor', False):
            return AtividadeAcademica.objects.all().order_by('-data_inicio')

        # Se for Aluno, vê apenas as suas próprias atividades
        if getattr(user, 'is_aluno', False) and hasattr(user, 'aluno_profile'):
            return AtividadeAcademica.objects.filter(aluno=user.aluno_profile).order_by('-data_inicio')

        return AtividadeAcademica.objects.none()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AtividadeAcademicaCreateUpdateSerializer
        return AtividadeAcademicaSerializer

    def get_permissions(self):
        # Apenas Servidor e Professor podem criar, alterar ou deletar atividades
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), (IsServidor | IsProfessor)()]
        return super().get_permissions()
