from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view
from apps.core.permissions import IsServidor, IsProfessor, IsAluno
from apps.atividades.models import AtividadeAcademica
from apps.atividades.serializers import (
    AtividadeAcademicaSerializer,
    AtividadeAcademicaCreateUpdateSerializer
)

@extend_schema_view(
    list=extend_schema(tags=['Atividades Acadêmicas']),
    retrieve=extend_schema(tags=['Atividades Acadêmicas']),
    create=extend_schema(tags=['Atividades Acadêmicas']),
    update=extend_schema(tags=['Atividades Acadêmicas']),
    partial_update=extend_schema(tags=['Atividades Acadêmicas']),
    destroy=extend_schema(tags=['Atividades Acadêmicas']),
)
class AtividadeAcademicaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo', 'status', 'aluno', 'aluno__curso', 'aluno__curso__campus']
    search_fields = ['descricao', 'aluno__usuario__nome', 'aluno__usuario__matricula', 'numero_processo']

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
        if self.action in ['update', 'partial_update', 'destroy', 'aprovar']:
            return [IsAuthenticated(), IsServidor()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        """
        Aprova uma atividade acadêmica.
        """
        atividade = self.get_object()
        atividade.aprovada = True
        atividade.save()
        return Response(
            {"detail": "Atividade acadêmica aprovada com sucesso."},
            status=status.HTTP_200_OK
        )
