from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor
from apps.core.exceptions import BusinessValidationError
from apps.emprestimos.models import Emprestimo
from apps.emprestimos.services import EmprestimoService
from apps.emprestimos.serializers import (
    EmprestimoSerializer,
    EmprestimoCreateSerializer,
    EmprestimoReturnSerializer
)

class EmprestimoViewSet(viewsets.ModelViewSet):
    queryset = Emprestimo.objects.all().order_by('-data_saida')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['status', 'ativo', 'usuario', 'autorizado_por']
    search_fields = ['ativo__nome', 'ativo__serial_patrimonio', 'usuario__nome', 'usuario__matricula']

    def get_serializer_class(self):
        if self.action == 'create':
            return EmprestimoCreateSerializer
        return EmprestimoSerializer

    # Sobrescreve update e destroy para evitar alterações manuais diretas de empréstimos fora do fluxo de devolução
    def update(self, request, *args, **kwargs):
        raise BusinessValidationError("Não é permitido editar empréstimos diretamente. Utilize a rota /devolver/.")

    def destroy(self, request, *args, **kwargs):
        raise BusinessValidationError("Não é permitido deletar empréstimos por questões de histórico de auditoria.")

    @action(detail=True, methods=['post'], serializer_class=EmprestimoReturnSerializer)
    def devolver(self, request, pk=None):
        """
        Registra a devolução do ativo emprestado.
        """
        emprestimo = self.get_object()
        serializer = EmprestimoReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not hasattr(request.user, 'servidor_profile'):
            raise BusinessValidationError("Apenas servidores com perfil ativo podem registrar devoluções.")
            
        devolvido_por = request.user.servidor_profile
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
