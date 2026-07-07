from rest_framework import serializers
from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.openapi import OpenApiTypes
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, MovimentacaoAtivo, StatusAtivo
from apps.ativos.services import SoftwareService, AtivoService
from apps.instituicao.serializers import SetorSerializer, SalaSerializer
from apps.usuarios.serializers import ServidorSerializer
from apps.instituicao.models import Setor

# Campos editáveis diretamente pelo CRUD de Ativo.
# imagem_url e storage_key são gerenciados exclusivamente via /upload_imagem/.
ATIVO_CRUD_FIELDS = [
    'id', 'serial_patrimonio', 'nome', 'descricao', 'especificacao_tecnica',
    'etiquetado', 'categoria', 'status', 'elegivel_emprestimo',
    'setor', 'responsavel', 'created_at', 'updated_at',
]


class AtivoSerializer(serializers.ModelSerializer):
    setor_detail = SetorSerializer(source='setor', read_only=True)
    responsavel_detail = ServidorSerializer(source='responsavel', read_only=True)
    ti_profile = serializers.SerializerMethodField()

    class Meta:
        model = Ativo
        fields = ATIVO_CRUD_FIELDS + ['imagem_url', 'setor_detail', 'responsavel_detail', 'ti_profile']

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_ti_profile(self, obj):
        if hasattr(obj, 'ti_profile'):
            return {
                'marca': obj.ti_profile.marca,
                'memoria_ram_gb': obj.ti_profile.memoria_ram_gb,
                'armazenamento_gb': obj.ti_profile.armazenamento_gb,
                'sistema_operacional': obj.ti_profile.sistema_operacional,
                'numero_serie': obj.ti_profile.numero_serie,
                'sala': obj.ti_profile.sala.id if obj.ti_profile.sala else None,
                'sala_detail': {
                    'id': obj.ti_profile.sala.id,
                    'numero': obj.ti_profile.sala.numero,
                    'tipo': obj.ti_profile.sala.tipo,
                    'campus': obj.ti_profile.sala.campus.sigla
                } if obj.ti_profile.sala else None,
                'created_at': obj.ti_profile.created_at,
            }
        return None


class AtivoTINestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtivoTI
        exclude = ['ativo']

class AtivoCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer de escrita para Ativo.
    Nunca expõe imagem_url nem storage_key — esses campos são
    gerenciados exclusivamente via POST /api/ativos/{id}/upload_imagem/.
    """
    ti_profile = AtivoTINestedSerializer(required=False, write_only=True)

    class Meta:
        model = Ativo
        fields = ATIVO_CRUD_FIELDS + ['ti_profile']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        categoria = data.get('categoria', '')
        if self.instance:
            categoria = data.get('categoria', self.instance.categoria)
            
        categorias_ti = ['ti', 'equipamentos de ti', 'tecnologia da informacao', 'tecnologia da informação']
        is_ti = categoria.lower().strip() in categorias_ti

        ti_profile_data = data.get('ti_profile')

        if is_ti and not ti_profile_data and not (self.instance and hasattr(self.instance, 'ti_profile')):
            raise serializers.ValidationError({"ti_profile": "Dados de TI (ti_profile) são obrigatórios para ativos da categoria de TI."})
            
        if not is_ti and ti_profile_data:
            raise serializers.ValidationError({"ti_profile": "Dados de TI não devem ser enviados para ativos que não são da categoria de TI."})

        return data

    @transaction.atomic
    def create(self, validated_data):
        ti_profile_data = validated_data.pop('ti_profile', None)
        ativo = super().create(validated_data)
        if ti_profile_data:
            AtivoTI.objects.create(ativo=ativo, **ti_profile_data)
        return ativo

    @transaction.atomic
    def update(self, instance, validated_data):
        ti_profile_data = validated_data.pop('ti_profile', None)
        ativo = super().update(instance, validated_data)
        
        if ti_profile_data:
            if hasattr(ativo, 'ti_profile'):
                for key, value in ti_profile_data.items():
                    setattr(ativo.ti_profile, key, value)
                ativo.ti_profile.save()
            else:
                AtivoTI.objects.create(ativo=ativo, **ti_profile_data)
        return ativo


class AtivoImageUploadSerializer(serializers.Serializer):
    """Serializer para o endpoint de upload de imagem do ativo."""
    file = serializers.ImageField(
        help_text='Arquivo de imagem do ativo (JPEG, PNG, WEBP). Máximo 5 MB.'
    )


class AtivoTISerializer(serializers.ModelSerializer):
    ativo_detail = AtivoSerializer(source='ativo', read_only=True)
    sala_detail = SalaSerializer(source='sala', read_only=True)

    class Meta:
        model = AtivoTI
        fields = '__all__'


class AtivoTICreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtivoTI
        fields = '__all__'


class SoftwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Software
        fields = '__all__'


class InstalacaoSoftwareSerializer(serializers.ModelSerializer):
    software_detail = SoftwareSerializer(source='software', read_only=True)
    ativo_ti_detail = AtivoTISerializer(source='ativo_ti', read_only=True)

    class Meta:
        model = InstalacaoSoftware
        fields = '__all__'


class InstalacaoSoftwareCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstalacaoSoftware
        fields = ['software', 'ativo_ti']

    def create(self, validated_data):
        software = validated_data['software']
        ativo_ti = validated_data['ativo_ti']
        # Chama a camada de serviço para encapsular a regra de licenças
        return SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti)


class MovimentacaoAtivoSerializer(serializers.ModelSerializer):
    ativo_detail = AtivoSerializer(source='ativo', read_only=True)
    operador_detail = ServidorSerializer(source='operador', read_only=True)
    setor_detail = SetorSerializer(source='setor', read_only=True)

    class Meta:
        model = MovimentacaoAtivo
        fields = '__all__'


class AtivoTransferSerializer(serializers.Serializer):
    novo_setor = serializers.PrimaryKeyRelatedField(queryset=Setor.objects.all(), required=True)
    novo_status = serializers.ChoiceField(choices=StatusAtivo.choices, required=False, allow_null=True)
    observacao = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)


from apps.ativos.models import SolicitacaoInstalacao, StatusSolicitacaoInstalacao
from apps.usuarios.serializers import UsuarioSerializer

class SolicitacaoInstalacaoSerializer(serializers.ModelSerializer):
    software_detail = SoftwareSerializer(source='software', read_only=True)
    solicitante_detail = UsuarioSerializer(source='solicitante', read_only=True)
    sala_detail = SalaSerializer(source='sala', read_only=True)
    ativo_ti_detail = AtivoTISerializer(source='ativo_ti', read_only=True)

    class Meta:
        model = SolicitacaoInstalacao
        fields = '__all__'


class SolicitacaoInstalacaoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitacaoInstalacao
        fields = ['software', 'sala', 'ativo_ti', 'observacao']

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError("Usuário não autenticado.")
        
        # O solicitante é o usuário logado
        validated_data['solicitante'] = request.user
        validated_data['status'] = StatusSolicitacaoInstalacao.PENDENTE
        
        try:
            solicitacao = SolicitacaoInstalacao.objects.create(**validated_data)
            return solicitacao
        except BusinessValidationError as e:
            raise serializers.ValidationError(e.message)


class SolicitacaoInstalacaoApprovalSerializer(serializers.Serializer):
    aprovado = serializers.BooleanField(required=True)
    observacao = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
