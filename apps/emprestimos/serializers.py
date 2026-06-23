from rest_framework import serializers
from apps.emprestimos.models import Emprestimo, StatusConservacao, StatusEmprestimo
from apps.emprestimos.services import EmprestimoService
from apps.ativos.serializers import AtivoSerializer
from apps.usuarios.serializers import UsuarioSerializer, ServidorSerializer
from apps.core.exceptions import BusinessValidationError

class EmprestimoSerializer(serializers.ModelSerializer):
    ativo_detail = AtivoSerializer(source='ativo', read_only=True)
    usuario_detail = UsuarioSerializer(source='usuario', read_only=True)
    autorizado_por_detail = ServidorSerializer(source='autorizado_por', read_only=True)

    class Meta:
        model = Emprestimo
        fields = '__all__'


class EmprestimoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Emprestimo
        fields = ['ativo', 'usuario', 'data_devolucao_prevista', 'observacao_saida']

    def create(self, validated_data):
        request = self.context.get('request')
        
        # O autorizador deve ser o Servidor autenticado no request
        if not request or not hasattr(request.user, 'servidor_profile'):
            raise BusinessValidationError("Apenas servidores ativos podem autorizar empréstimos.")
            
        autorizado_por = request.user.servidor_profile
        ativo = validated_data['ativo']
        usuario = validated_data['usuario']
        data_devolucao_prevista = validated_data['data_devolucao_prevista']
        observacao_saida = validated_data.get('observacao_saida')

        return EmprestimoService.realizar_emprestimo(
            ativo=ativo,
            usuario=usuario,
            autorizado_por=autorizado_por,
            data_devolucao_prevista=data_devolucao_prevista,
            observacao_saida=observacao_saida
        )


class EmprestimoReturnSerializer(serializers.Serializer):
    status_conservacao = serializers.ChoiceField(choices=StatusConservacao.choices, required=True)
    observacao_devolucao = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
