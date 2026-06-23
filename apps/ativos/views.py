from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor
from apps.core.exceptions import BusinessValidationError
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, MovimentacaoAtivo
from apps.ativos.services import AtivoService
from apps.ativos.serializers import (
    AtivoSerializer,
    AtivoCreateUpdateSerializer,
    AtivoTISerializer,
    AtivoTICreateUpdateSerializer,
    SoftwareSerializer,
    InstalacaoSoftwareSerializer,
    InstalacaoSoftwareCreateSerializer,
    MovimentacaoAtivoSerializer,
    AtivoTransferSerializer
)

class AtivoViewSet(viewsets.ModelViewSet):
    queryset = Ativo.objects.all().order_by('nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['status', 'elegivel_emprestimo', 'setor', 'responsavel', 'categoria']
    search_fields = ['nome', 'serial_patrimonio', 'descricao', 'categoria']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AtivoCreateUpdateSerializer
        return AtivoSerializer

    @action(detail=True, methods=['post'], serializer_class=AtivoTransferSerializer)
    def transferir(self, request, pk=None):
        """
        Transfere o ativo para um novo setor ou atualiza seu status, 
        registrando a alteração no histórico de movimentações.
        """
        ativo = self.get_object()
        serializer = AtivoTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # O operador deve ser um Servidor cadastrado
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
            observacao=observacao
        )

        return Response(
            MovimentacaoAtivoSerializer(movimentacao).data,
            status=status.HTTP_200_OK
        )


class AtivoTIViewSet(viewsets.ModelViewSet):
    queryset = AtivoTI.objects.all().order_by('ativo__nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['marca', 'sistema_operacional']
    search_fields = ['marca', 'sistema_operacional', 'numero_serie', 'ativo__nome', 'ativo__serial_patrimonio']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AtivoTICreateUpdateSerializer
        return AtivoTISerializer


class SoftwareViewSet(viewsets.ModelViewSet):
    queryset = Software.objects.all().order_by('nome')
    serializer_class = SoftwareSerializer
    permission_classes = [IsAuthenticated, IsServidor]
    search_fields = ['nome', 'fabricante']


class InstalacaoSoftwareViewSet(viewsets.ModelViewSet):
    queryset = InstalacaoSoftware.objects.all().order_by('-data_instalacao')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['software', 'ativo_ti']
    search_fields = ['software__nome', 'ativo_ti__ativo__nome', 'ativo_ti__ativo__serial_patrimonio']

    def get_serializer_class(self):
        if self.action in ['create']:
            return InstalacaoSoftwareCreateSerializer
        return InstalacaoSoftwareSerializer


class MovimentacaoAtivoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Histórico de movimentações de ativos (Apenas leitura para auditoria).
    """
    queryset = MovimentacaoAtivo.objects.all().order_by('-registrado_em')
    serializer_class = MovimentacaoAtivoSerializer
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['ativo', 'operador', 'setor', 'status_novo']
    search_fields = ['ativo__nome', 'ativo__serial_patrimonio', 'observacao', 'operador__usuario__nome']
