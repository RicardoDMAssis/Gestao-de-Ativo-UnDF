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
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'email', 'matricula']

    def get_queryset(self):
        queryset = Usuario.objects.all().prefetch_related(
            'aluno_profile',
            'aluno_profile__curso',
            'aluno_profile__curso__escola',
            'servidor_profile',
            'servidor_profile__setor',
            'servidor_profile__setor__campus',
            'professor_profile'
        ).order_by('nome')
        tipo = self.request.query_params.get('tipo_usuario')
        if tipo:
            from django.db.models import Q
            if tipo == 'Professor':
                queryset = queryset.filter(Q(tipo_usuario='Professor') | Q(professor_profile__isnull=False)).distinct()
            elif tipo == 'Servidor':
                queryset = queryset.filter(Q(tipo_usuario='Servidor') | Q(servidor_profile__isnull=False)).distinct()
            elif tipo == 'Aluno':
                queryset = queryset.filter(Q(tipo_usuario='Aluno') | Q(aluno_profile__isnull=False)).distinct()
            else:
                queryset = queryset.filter(tipo_usuario=tipo)
        return queryset

    def get_permissions(self):
        if self.action in ['me', 'upload_foto', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsServidor()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UsuarioCreateSerializer
        return UsuarioSerializer

    @extend_schema(tags=['Perfil Logado'], summary="Obter ou atualizar dados do usuário atual")
    @action(detail=False, methods=['get', 'patch', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Retorna ou atualiza o perfil do usuário logado atualmente.
        """
        user = request.user
        if request.method in ['PATCH', 'PUT']:
            # Permite atualizar apenas o nome_social
            if 'nome_social' in request.data:
                user.nome_social = request.data.get('nome_social')
                user.save()
        
        serializer = UsuarioSerializer(user)
        data = serializer.data
        
        # Adiciona dados específicos do perfil
        if request.user.is_aluno and hasattr(request.user, 'aluno_profile'):
            data['aluno_profile'] = AlunoSerializer(request.user.aluno_profile).data
        if request.user.is_professor and hasattr(request.user, 'professor_profile'):
            data['professor_profile'] = ProfessorSerializer(request.user.professor_profile).data
        if request.user.is_servidor and hasattr(request.user, 'servidor_profile'):
            data['servidor_profile'] = ServidorSerializer(request.user.servidor_profile).data
            
        return Response(data)

    @extend_schema(tags=['Perfil Logado'], summary="Fazer upload de foto de perfil")
    @action(detail=False, methods=['post'], url_path='upload-foto', permission_classes=[IsAuthenticated])
    def upload_foto(self, request):
        """
        Faz upload de um arquivo de imagem para foto de perfil do usuário logado.
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Nenhum arquivo enviado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.ativos.storage import SupabaseStorageService
        from apps.core.exceptions import BusinessValidationError
        
        user = request.user
        if user.foto_storage_key:
            SupabaseStorageService.delete_imagem(user.foto_storage_key, bucket='fotos-perfil')
            
        try:
            public_url, storage_key = SupabaseStorageService.upload_perfil(file, user.id)
            user.foto_url = public_url
            user.foto_storage_key = storage_key
            user.save()
            return Response({
                'foto_url': public_url,
                'foto_storage_key': storage_key
            }, status=status.HTTP_200_OK)
        except BusinessValidationError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


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
