from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor
from apps.usuarios.models import Usuario, Aluno, Professor, Servidor
from apps.usuarios.serializers import (
    UsuarioSerializer,
    UsuarioCreateSerializer,
    AlunoSerializer,
    AlunoCreateUpdateSerializer,
    ProfessorSerializer,
    ProfessorCreateUpdateSerializer,
    ServidorSerializer,
    ServidorCreateUpdateSerializer
)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['tipo_usuario', 'ativo']
    search_fields = ['nome', 'email', 'matricula']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UsuarioCreateSerializer
        return UsuarioSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Retorna o perfil do usuário logado atualmente.
        """
        serializer = UsuarioSerializer(request.user)
        data = serializer.data
        
        # Adiciona dados específicos do perfil
        if request.user.is_aluno and hasattr(request.user, 'aluno_profile'):
            data['aluno_profile'] = AlunoSerializer(request.user.aluno_profile).data
        elif request.user.is_professor and hasattr(request.user, 'professor_profile'):
            data['professor_profile'] = ProfessorSerializer(request.user.professor_profile).data
        elif request.user.is_servidor and hasattr(request.user, 'servidor_profile'):
            data['servidor_profile'] = ServidorSerializer(request.user.servidor_profile).data
            
        return Response(data)


class AlunoViewSet(viewsets.ModelViewSet):
    queryset = Aluno.objects.all().order_by('usuario__nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['curso', 'semestre']
    search_fields = ['usuario__nome', 'usuario__email', 'usuario__matricula', 'curso__nome', 'curso__sigla']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AlunoCreateUpdateSerializer
        return AlunoSerializer


class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = Professor.objects.all().order_by('usuario__nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['regime_trabalho']
    search_fields = ['usuario__nome', 'usuario__email', 'usuario__matricula']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProfessorCreateUpdateSerializer
        return ProfessorSerializer


class ServidorViewSet(viewsets.ModelViewSet):
    queryset = Servidor.objects.all().order_by('usuario__nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['setor', 'cargo']
    search_fields = ['usuario__nome', 'usuario__email', 'usuario__matricula', 'cargo']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ServidorCreateUpdateSerializer
        return ServidorSerializer
