from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor
from apps.core.exceptions import BusinessValidationError
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, MovimentacaoAtivo
from apps.ativos.services import AtivoService
from apps.ativos.storage import SupabaseStorageService
from apps.ativos.serializers import (
    AtivoSerializer,
    AtivoCreateUpdateSerializer,
    AtivoImageUploadSerializer,
    AtivoTISerializer,
    AtivoTICreateUpdateSerializer,
    SoftwareSerializer,
    SoftwareImageUploadSerializer,
    InstalacaoSoftwareSerializer,
    InstalacaoSoftwareCreateSerializer,
    MovimentacaoAtivoSerializer,
    AtivoTransferSerializer,
)

from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor, IsProfessor
from apps.core.exceptions import BusinessValidationError
from apps.usuarios.models import TipoUsuario
from apps.ativos.models import (
    Ativo,
    AtivoTI,
    Software,
    InstalacaoSoftware,
    MovimentacaoAtivo,
    SolicitacaoInstalacao,
    StatusSolicitacaoInstalacao
)
from apps.ativos.services import AtivoService, SoftwareService
from apps.ativos.storage import SupabaseStorageService
from apps.ativos.serializers import (
    AtivoSerializer,
    AtivoCreateUpdateSerializer,
    AtivoImageUploadSerializer,
    AtivoTISerializer,
    AtivoTICreateUpdateSerializer,
    SoftwareSerializer,
    InstalacaoSoftwareSerializer,
    InstalacaoSoftwareCreateSerializer,
    MovimentacaoAtivoSerializer,
    AtivoTransferSerializer,
    SolicitacaoInstalacaoSerializer,
    SolicitacaoInstalacaoCreateSerializer,
    SolicitacaoInstalacaoApprovalSerializer
)


@extend_schema_view(
    list=extend_schema(tags=['Ativos']),
    retrieve=extend_schema(tags=['Ativos']),
    create=extend_schema(tags=['Ativos']),
    update=extend_schema(tags=['Ativos']),
    partial_update=extend_schema(tags=['Ativos']),
    destroy=extend_schema(tags=['Ativos']),
)
class AtivoViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']
    filterset_fields = ['elegivel_emprestimo', 'setor', 'responsavel', 'categoria']
    search_fields = ['nome', 'serial_patrimonio', 'descricao', 'categoria']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Ativo.objects.none()

        # Servidor vê todos
        if getattr(user, 'is_servidor', False):
            queryset = Ativo.objects.all().select_related(
                'setor',
                'setor__campus',
                'responsavel',
                'responsavel__usuario',
                'responsavel__setor',
                'responsavel__setor__campus'
            ).prefetch_related(
                'ti_profile',
                'ti_profile__sala',
                'ti_profile__sala__campus'
            ).order_by('nome')
        else:
            # Aluno e Professor veem apenas os elegíveis para empréstimo
            queryset = Ativo.objects.filter(elegivel_emprestimo=True).select_related(
                'setor',
                'setor__campus',
                'responsavel',
                'responsavel__usuario',
                'responsavel__setor',
                'responsavel__setor__campus'
            ).prefetch_related(
                'ti_profile',
                'ti_profile__sala',
                'ti_profile__sala__campus'
            ).order_by('nome')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter in ['disponiveis', 'Disponivel']:
                queryset = queryset.filter(emprestado=False, status='Novo')
            elif status_filter == 'Emprestado':
                queryset = queryset.filter(emprestado=True)
            elif status_filter == 'todos':
                pass  # Não filtra por status
            else:
                queryset = queryset.filter(status=status_filter)

        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'entrar_fila', 'sair_fila']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsServidor()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AtivoCreateUpdateSerializer
        if self.action == 'upload_imagem':
            return AtivoImageUploadSerializer
        return AtivoSerializer

    @extend_schema(tags=['Ativos'], summary="Transferir Ativo e Registrar Movimentação")
    @action(detail=True, methods=['post'], serializer_class=AtivoTransferSerializer)
    def transferir(self, request, pk=None):
        """
        Transfere o ativo para um novo setor e/ou atualiza seu status,
        registrando a alteração no histórico de movimentações.
        """
        ativo = self.get_object()
        serializer = AtivoTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not hasattr(request.user, 'servidor_profile'):
            raise BusinessValidationError("Apenas servidores com perfil ativo podem operar movimentações.")

        operador = request.user.servidor_profile
        novo_setor = serializer.validated_data['novo_setor']
        novo_status = serializer.validated_data.get('novo_status')
        observacao = serializer.validated_data.get('observacao')

        movimentacao = AtivoService.transferir_ativo(
            ativo=ativo,
            novo_setor=novo_setor,
            operador=operador,
            novo_status=novo_status,
            observacao=observacao,
        )

        return Response(
            MovimentacaoAtivoSerializer(movimentacao).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=['Ativos'], summary="Upload de Imagem do Ativo")
    @action(
        detail=True,
        methods=['post'],
        serializer_class=AtivoImageUploadSerializer,
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    def upload_imagem(self, request, pk=None):
        """
        Faz upload de uma imagem para o ativo e salva a URL pública.
        """
        ativo = self.get_object()
        serializer = AtivoImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['file']

        if ativo.storage_key:
            SupabaseStorageService.delete_imagem(ativo.storage_key)

        public_url, storage_key = SupabaseStorageService.upload_imagem(
            file=file,
            ativo_id=ativo.pk,
        )

        ativo.imagem_url = public_url
        ativo.storage_key = storage_key
        ativo.save(update_fields=['imagem_url', 'storage_key'])

        return Response(
            {
                'detail': 'Imagem enviada com sucesso.',
                'imagem_url': public_url,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=['Ativos - Fila de Espera'], summary="Entrar na fila de espera do ativo")
    @action(detail=True, methods=['post'], url_path='entrar-fila')
    def entrar_fila(self, request, pk=None):
        ativo = self.get_object()
        user = request.user
        
        if not ativo.elegivel_emprestimo:
            return Response({'error': 'Este ativo não está disponível para empréstimos.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.emprestimos.models import FilaEmprestimo
        if FilaEmprestimo.objects.filter(ativo=ativo, usuario=user).exists():
            return Response({'error': 'Você já está na fila de espera deste ativo.'}, status=status.HTTP_400_BAD_REQUEST)
            
        FilaEmprestimo.objects.create(ativo=ativo, usuario=user)
        
        serializer = self.get_serializer(ativo)
        return Response({
            'success': 'Você entrou na fila de espera.',
            'ativo': serializer.data
        }, status=status.HTTP_200_OK)

    @extend_schema(tags=['Ativos - Fila de Espera'], summary="Sair da fila de espera do ativo")
    @action(detail=True, methods=['post'], url_path='sair-fila')
    def sair_fila(self, request, pk=None):
        ativo = self.get_object()
        user = request.user
        
        from apps.emprestimos.models import FilaEmprestimo
        entry = FilaEmprestimo.objects.filter(ativo=ativo, usuario=user).first()
        if not entry:
            return Response({'error': 'Você não está na fila de espera deste ativo.'}, status=status.HTTP_400_BAD_REQUEST)
            
        entry.delete()
        
        serializer = self.get_serializer(ativo)
        return Response({
            'success': 'Você saiu da fila de espera.',
            'ativo': serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(tags=['Ativos de TI']),
    retrieve=extend_schema(tags=['Ativos de TI']),
)
class AtivoTIViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AtivoTI.objects.all().order_by('ativo__nome')
    permission_classes = [IsAuthenticated]
    filterset_fields = ['marca', 'sistema_operacional', 'sala']
    search_fields = ['marca', 'sistema_operacional', 'numero_serie', 'ativo__nome', 'ativo__serial_patrimonio']
    serializer_class = AtivoTISerializer


@extend_schema_view(
    list=extend_schema(tags=['Módulo SAM (Softwares)']),
    retrieve=extend_schema(tags=['Módulo SAM (Softwares)']),
    create=extend_schema(tags=['Módulo SAM (Softwares)']),
    update=extend_schema(tags=['Módulo SAM (Softwares)']),
    partial_update=extend_schema(tags=['Módulo SAM (Softwares)']),
    destroy=extend_schema(tags=['Módulo SAM (Softwares)']),
)
class SoftwareViewSet(viewsets.ModelViewSet):
    queryset = Software.objects.all().order_by('nome')
    serializer_class = SoftwareSerializer
    search_fields = ['nome', 'fabricante']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsServidor()]

    @action(
        detail=True,
        methods=['post'],
        url_path='upload-imagem',
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    def upload_imagem(self, request, pk=None):
        """
        Faz upload de uma imagem (png ou svg) para o software e salva a URL pública.
        """
        software = self.get_object()
        serializer = SoftwareImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['file']

        if software.storage_key:
            try:
                SupabaseStorageService.delete_imagem(software.storage_key)
            except Exception:
                pass

        public_url, storage_key = SupabaseStorageService.upload_software_imagem(
            file=file,
            software_id=software.pk,
        )

        software.imagem_url = public_url
        software.storage_key = storage_key
        software.save(update_fields=['imagem_url', 'storage_key'])

        return Response(
            {
                'status': 'success',
                'message': 'Imagem do software enviada com sucesso.',
                'imagem_url': public_url,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(tags=['Módulo SAM (Softwares)']),
    retrieve=extend_schema(tags=['Módulo SAM (Softwares)']),
    create=extend_schema(tags=['Módulo SAM (Softwares)']),
    destroy=extend_schema(tags=['Módulo SAM (Softwares)']),
)
class InstalacaoSoftwareViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    queryset = InstalacaoSoftware.objects.all().order_by('-data_instalacao')
    filterset_fields = ['software', 'ativo_ti']
    search_fields = ['software__nome', 'ativo_ti__ativo__nome', 'ativo_ti__ativo__serial_patrimonio']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsServidor()]

    def get_serializer_class(self):
        if self.action == 'create':
            return InstalacaoSoftwareCreateSerializer
        return InstalacaoSoftwareSerializer


@extend_schema_view(
    list=extend_schema(tags=['Movimentações (Histórico)']),
    retrieve=extend_schema(tags=['Movimentações (Histórico)']),
)
class MovimentacaoAtivoViewSet(viewsets.ReadOnlyModelViewSet):
    """Histórico de movimentações de ativos (somente leitura para auditoria)."""
    queryset = MovimentacaoAtivo.objects.all().order_by('-registrado_em')
    serializer_class = MovimentacaoAtivoSerializer
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['ativo', 'operador', 'setor', 'status_novo']
    search_fields = ['ativo__nome', 'ativo__serial_patrimonio', 'observacao', 'operador__usuario__nome']


@extend_schema_view(
    list=extend_schema(tags=['Módulo SAM (Solicitações)']),
    retrieve=extend_schema(tags=['Módulo SAM (Solicitações)']),
    create=extend_schema(tags=['Módulo SAM (Solicitações)']),
)
class SolicitacaoInstalacaoViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    filterset_fields = ['status', 'software', 'sala', 'ativo_ti']
    search_fields = ['software__nome', 'solicitante__nome', 'observacao']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return SolicitacaoInstalacao.objects.none()
        
        # Servidores veem tudo
        if getattr(user, 'is_servidor', False):
            return SolicitacaoInstalacao.objects.all().order_by('-created_at')
        
        # Professores veem as suas
        if getattr(user, 'is_professor', False):
            return SolicitacaoInstalacao.objects.filter(solicitante=user).order_by('-created_at')

        return SolicitacaoInstalacao.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated(), (IsServidor | IsProfessor)()]
        if self.action in ['processar', 'destroy']:
            return [IsAuthenticated(), IsServidor()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitacaoInstalacaoCreateSerializer
        if self.action == 'processar':
            return SolicitacaoInstalacaoApprovalSerializer
        return SolicitacaoInstalacaoSerializer

    @extend_schema(tags=['Módulo SAM (Solicitações)'], summary="Processar (Aprovar ou Rejeitar) Solicitação de Instalação")
    @action(detail=True, methods=['post'])
    def processar(self, request, pk=None):
        solicitacao = self.get_object()
        serializer = SolicitacaoInstalacaoApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if not hasattr(request.user, 'servidor_profile'):
            raise BusinessValidationError("Apenas servidores ativos podem processar solicitações.")
            
        operador = request.user.servidor_profile
        aprovado = serializer.validated_data['aprovado']
        observacao = serializer.validated_data.get('observacao')
        
        solicitacao_atualizada = SoftwareService.processar_solicitacao_instalacao(
            solicitacao=solicitacao,
            aprovado=aprovado,
            operador=operador,
            observacao=observacao
        )
        
        return Response(
            SolicitacaoInstalacaoSerializer(solicitacao_atualizada).data,
            status=status.HTTP_200_OK
        )
