from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view
from apps.core.permissions import IsServidor
from apps.core.exceptions import BusinessValidationError
from apps.emprestimos.models import Emprestimo, StatusEmprestimo
from apps.emprestimos.services import EmprestimoService
from apps.usuarios.models import TipoUsuario
from apps.emprestimos.serializers import (
    EmprestimoSerializer,
    EmprestimoCreateSerializer,
    EmprestimoReturnSerializer,
    SolicitacaoEmprestimoCreateSerializer,
    EmprestimoRejectionSerializer
)

@extend_schema_view(
    list=extend_schema(tags=['Empréstimos']),
    retrieve=extend_schema(tags=['Empréstimos']),
    create=extend_schema(tags=['Empréstimos']),
    destroy=extend_schema(tags=['Empréstimos'], summary="Cancelar (Soft Delete) Empréstimo"),
)
class EmprestimoViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    filterset_fields = ['status', 'ativo', 'usuario', 'autorizado_por']
    search_fields = ['ativo__nome', 'ativo__serial_patrimonio', 'usuario__nome', 'usuario__matricula']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Emprestimo.objects.none()
        
        # Servidor vê todos
        if user.tipo_usuario == TipoUsuario.SERVIDOR:
            return Emprestimo.objects.all().order_by('-created_at')
        
        # Aluno/Professor vê apenas os seus
        return Emprestimo.objects.filter(usuario=user).order_by('-created_at')

    def get_permissions(self):
        if self.action in ['devolver', 'aprovar', 'rejeitar', 'destroy']:
            return [IsAuthenticated(), IsServidor()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            if self.request.user and self.request.user.is_authenticated and self.request.user.tipo_usuario == TipoUsuario.SERVIDOR:
                return EmprestimoCreateSerializer
            return SolicitacaoEmprestimoCreateSerializer
        elif self.action == 'devolver':
            return EmprestimoReturnSerializer
        elif self.action == 'rejeitar':
            return EmprestimoRejectionSerializer
        return EmprestimoSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Soft Delete (Cancelamento Lógico).
        """
        emprestimo = self.get_object()
        if emprestimo.status == StatusEmprestimo.CONCLUIDO:
            raise BusinessValidationError("Empréstimos já concluídos não podem ser cancelados.")
            
        emprestimo.status = StatusEmprestimo.FINALIZADO
        
        observacao_original = emprestimo.observacao_devolucao or ''
        emprestimo.observacao_devolucao = f"{observacao_original}\n[Cancelado por {request.user.nome}]".strip()
        
        emprestimo.save()
        
        # Libera o ativo para DISPONIVEL novamente, se não estiver avariado/etc.
        if emprestimo.ativo.status == 'Emprestado':
            from apps.ativos.services import AtivoService
            from apps.ativos.models import StatusAtivo
            AtivoService.transferir_ativo(
                ativo=emprestimo.ativo,
                novo_setor=emprestimo.ativo.setor,
                operador=request.user.get_servidor_profile(),
                novo_status=StatusAtivo.DISPONIVEL,
                observacao=f"Cancelamento de Empréstimo ID {emprestimo.id}."
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(tags=['Empréstimos'], summary="Registrar Devolução de Ativo")
    @action(detail=True, methods=['post'])
    def devolver(self, request, pk=None):
        """
        Registra a devolução do ativo emprestado.
        """
        emprestimo = self.get_object()
        serializer = EmprestimoReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.get_servidor_profile():
            raise BusinessValidationError("Apenas servidores com perfil ativo podem registrar devoluções.")
            
        devolvido_por = request.user.get_servidor_profile()
        status_conservacao = serializer.validated_data['status_conservacao']
        observacao_devolucao = serializer.validated_data.get('observacao_devolucao')

        emprestimo_atualizado = EmprestimoService.devolver_ativo(
            emprestimo=emprestimo,
            devolvido_por=devolvido_por,
            status_conservacao=status_conservacao,
            observacao_devolucao=observacao_devolucao
        )

        return Response(
            EmprestimoSerializer(emprestimo_atualizado).data,
            status=status.HTTP_200_OK
        )

    @extend_schema(tags=['Empréstimos'], summary="Aprovar Solicitação de Empréstimo")
    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        """
        Aprova uma solicitação de empréstimo pendente.
        """
        emprestimo = self.get_object()
        if not request.user.get_servidor_profile():
            raise BusinessValidationError("Apenas servidores com perfil ativo podem aprovar empréstimos.")
            
        autorizado_por = request.user.get_servidor_profile()
        emprestimo_atualizado = EmprestimoService.aprovar_emprestimo(
            emprestimo=emprestimo,
            autorizado_por=autorizado_por
        )
        return Response(
            EmprestimoSerializer(emprestimo_atualizado).data,
            status=status.HTTP_200_OK
        )

    @extend_schema(tags=['Empréstimos'], summary="Rejeitar Solicitação de Empréstimo")
    @action(detail=True, methods=['post'])
    def rejeitar(self, request, pk=None):
        """
        Rejeita uma solicitação de empréstimo pendente.
        """
        emprestimo = self.get_object()
        serializer = EmprestimoRejectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.get_servidor_profile():
            raise BusinessValidationError("Apenas servidores com perfil ativo podem rejeitar empréstimos.")
            
        operador = request.user.get_servidor_profile()
        motivo = serializer.validated_data.get('motivo')

        emprestimo_atualizado = EmprestimoService.rejeitar_emprestimo(
            emprestimo=emprestimo,
            operador=operador,
            observacao_rejeicao=motivo
        )
        return Response(
            EmprestimoSerializer(emprestimo_atualizado).data,
            status=status.HTTP_200_OK
        )

    @extend_schema(tags=['Empréstimos'], summary="Listar Meus Empréstimos")
    @action(detail=False, methods=['get'])
    def meus(self, request):
        """
        Permite que qualquer usuário logado visualize a lista de empréstimos solicitados por ele.
        """
        queryset = Emprestimo.objects.filter(usuario=request.user).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
