from rest_framework import serializers
from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.openapi import OpenApiTypes
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, MovimentacaoAtivo, StatusAtivo
from apps.ativos.services import SoftwareService, AtivoService
from apps.instituicao.serializers import SetorSerializer
from apps.usuarios.serializers import ServidorSerializer
from apps.instituicao.models import Setor

class AtivoSerializer(serializers.ModelSerializer):
    setor_detail = SetorSerializer(source='setor', read_only=True)
    responsavel_detail = ServidorSerializer(source='responsavel', read_only=True)
    ti_profile = serializers.SerializerMethodField()

    class Meta:
        model = Ativo
        fields = '__all__'

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_ti_profile(self, obj):
        if hasattr(obj, 'ti_profile'):
            return {
                'marca': obj.ti_profile.marca,
                'memoria_ram_gb': obj.ti_profile.memoria_ram_gb,
                'armazenamento_gb': obj.ti_profile.armazenamento_gb,
                'sistema_operacional': obj.ti_profile.sistema_operacional,
                'numero_serie': obj.ti_profile.numero_serie,
                'created_at': obj.ti_profile.created_at
            }
        return None


class AtivoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ativo
        fields = '__all__'


class AtivoTISerializer(serializers.ModelSerializer):
    ativo_detail = AtivoSerializer(source='ativo', read_only=True)

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
