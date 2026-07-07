from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor
from drf_spectacular.utils import extend_schema, extend_schema_view
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

@extend_schema_view(
    list=extend_schema(tags=['Usuários Gerais']),
    retrieve=extend_schema(tags=['Usuários Gerais']),
    create=extend_schema(tags=['Usuários Gerais']),
    update=extend_schema(tags=['Usuários Gerais']),
    partial_update=extend_schema(tags=['Usuários Gerais']),
    destroy=extend_schema(tags=['Usuários Gerais']),
)
class UsuarioViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']
    queryset = Usuario.objects.all().order_by('nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['tipo_usuario', 'ativo']
    search_fields = ['nome', 'email', 'matricula']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UsuarioCreateSerializer
        return UsuarioSerializer

    @extend_schema(tags=['Perfil Logado'], summary="Obter dados do usuário atual")
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


@extend_schema_view(
    list=extend_schema(tags=['Alunos']),
    retrieve=extend_schema(tags=['Alunos']),
)
class AlunoViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'put', 'patch', 'head', 'options']
    queryset = Aluno.objects.all().order_by('usuario__nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['curso', 'semestre']
    search_fields = ['usuario__nome', 'usuario__email', 'usuario__matricula', 'curso__nome', 'curso__sigla']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AlunoCreateUpdateSerializer
        return AlunoSerializer


@extend_schema_view(
    list=extend_schema(tags=['Professores']),
    retrieve=extend_schema(tags=['Professores']),
)
class ProfessorViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'put', 'patch', 'head', 'options']
    queryset = Professor.objects.all().order_by('usuario__nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['regime_trabalho']
    search_fields = ['usuario__nome', 'usuario__email', 'usuario__matricula']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProfessorCreateUpdateSerializer
        return ProfessorSerializer


@extend_schema_view(
    list=extend_schema(tags=['Servidores']),
    retrieve=extend_schema(tags=['Servidores']),
)
class ServidorViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'put', 'patch', 'head', 'options']
    queryset = Servidor.objects.all().order_by('usuario__nome')
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsServidor()]
    filterset_fields = ['setor', 'cargo']
    search_fields = ['usuario__nome', 'usuario__email', 'usuario__matricula', 'cargo']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ServidorCreateUpdateSerializer
        return ServidorSerializer
