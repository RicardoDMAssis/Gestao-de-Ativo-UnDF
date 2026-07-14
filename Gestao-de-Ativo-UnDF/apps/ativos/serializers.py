from rest_framework import serializers
from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.openapi import OpenApiTypes
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, MovimentacaoAtivo, StatusAtivo
from apps.ativos.services import SoftwareService, AtivoService
from apps.instituicao.serializers import SetorSerializer, SalaSerializer
from apps.usuarios.serializers import ServidorSerializer
from apps.instituicao.models import Setor, Sala

# Campos editáveis diretamente pelo CRUD de Ativo.
# imagem_url e storage_key são gerenciados exclusivamente via /upload_imagem/.
ATIVO_CRUD_FIELDS = [
    'id', 'serial_patrimonio', 'nome', 'descricao', 'especificacao_tecnica',
    'etiquetado', 'categoria', 'status', 'emprestado', 'elegivel_emprestimo',
    'setor', 'responsavel', 'created_at', 'updated_at',
]


class AtivoSerializer(serializers.ModelSerializer):
    setor_detail = SetorSerializer(source='setor', read_only=True)
    responsavel_detail = ServidorSerializer(source='responsavel', read_only=True)
    ti_profile = serializers.SerializerMethodField()
    fila_espera_count = serializers.SerializerMethodField()
    usuario_na_fila_posicao = serializers.SerializerMethodField()
    devolucao_prevista = serializers.SerializerMethodField()

    class Meta:
        model = Ativo
        fields = ATIVO_CRUD_FIELDS + [
            'imagem_url', 'setor_detail', 'responsavel_detail', 'ti_profile',
            'fila_espera_count', 'usuario_na_fila_posicao', 'devolucao_prevista'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if hasattr(instance, 'ti_profile') and instance.ti_profile and instance.ti_profile.sala and instance.ti_profile.sala.tipo == 'Laboratorio':
            data['elegivel_emprestimo'] = False
        return data

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

    @extend_schema_field(OpenApiTypes.INT)
    def get_fila_espera_count(self, obj):
        return obj.fila_espera.count()

    @extend_schema_field(OpenApiTypes.INT)
    def get_usuario_na_fila_posicao(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            entry = obj.fila_espera.filter(usuario=request.user).first()
            if entry:
                all_entries = list(obj.fila_espera.all().order_by('created_at'))
                try:
                    return all_entries.index(entry) + 1
                except ValueError:
                    return None
        return None

    @extend_schema_field(OpenApiTypes.STR)
    def get_devolucao_prevista(self, obj):
        from apps.emprestimos.models import Emprestimo, StatusEmprestimo
        active_loan = obj.emprestimos.filter(status=StatusEmprestimo.ATIVO).order_by('-created_at').first()
        if active_loan and active_loan.data_devolucao_prevista:
            return active_loan.data_devolucao_prevista.isoformat()
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


class AtivoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ativo
        fields = [
            'id', 'serial_patrimonio', 'nome', 'descricao',
            'categoria', 'status', 'emprestado', 'elegivel_emprestimo',
            'created_at', 'updated_at'
        ]


class AtivoTISerializer(serializers.ModelSerializer):
    ativo_detail = AtivoSimpleSerializer(source='ativo', read_only=True)
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


class SoftwareImageUploadSerializer(serializers.Serializer):
    file = serializers.FileField()


class InstalacaoSoftwareSerializer(serializers.ModelSerializer):
    software_detail = SoftwareSerializer(source='software', read_only=True)
    ativo_ti_detail = AtivoTISerializer(source='ativo_ti', read_only=True)

    class Meta:
        model = InstalacaoSoftware
        fields = '__all__'


class InstalacaoSoftwareCreateSerializer(serializers.Serializer):
    software = serializers.PrimaryKeyRelatedField(queryset=Software.objects.all())
    ativo_ti = serializers.PrimaryKeyRelatedField(queryset=AtivoTI.objects.all(), required=False, allow_null=True)
    sala = serializers.PrimaryKeyRelatedField(queryset=Sala.objects.all(), required=False, allow_null=True)

    def validate(self, data):
        ativo_ti = data.get('ativo_ti')
        sala = data.get('sala')
        if not ativo_ti and not sala:
            raise serializers.ValidationError("É necessário informar um Computador Individual (ativo_ti) ou uma Sala (sala).")
        if ativo_ti and sala:
            raise serializers.ValidationError("Não é possível especificar um Computador Individual e uma Sala simultaneamente.")
        return data

    def create(self, validated_data):
        software = validated_data['software']
        ativo_ti = validated_data.get('ativo_ti')
        sala = validated_data.get('sala')
        
        if sala:
            computadores = AtivoTI.objects.filter(sala=sala)
            if not computadores.exists():
                raise serializers.ValidationError({"sala": f"Não existem computadores de TI vinculados à sala '{sala.numero}'."})
            
            # Valida se há licenças suficientes
            instalacoes_ativas = InstalacaoSoftware.objects.filter(software=software).count()
            licencas_disponiveis = software.total_licencas_compradas - instalacoes_ativas
            
            # Computadores da sala que já não têm o software instalado
            computadores_a_instalar = []
            for comp in computadores:
                if not InstalacaoSoftware.objects.filter(software=software, ativo_ti=comp).exists():
                    computadores_a_instalar.append(comp)
            
            if not computadores_a_instalar:
                # Todos já têm o software instalado, retorna um objeto dummy ou o primeiro existente
                existente = InstalacaoSoftware.objects.filter(software=software, ativo_ti=computadores[0]).first()
                return existente
                
            if len(computadores_a_instalar) > licencas_disponiveis:
                raise serializers.ValidationError({
                    "sala": f"Não há licenças suficientes. Computadores a instalar: {len(computadores_a_instalar)}, Licenças disponíveis: {licencas_disponiveis}."
                })
            
            instalacoes = []
            for comp in computadores_a_instalar:
                inst = SoftwareService.instalar_software(software=software, ativo_ti=comp)
                instalacoes.append(inst)
            
            return instalacoes[0]
        else:
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
from apps.usuarios.models import Usuario

class UsuarioSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'matricula', 'tipo_usuario']


class SolicitacaoInstalacaoSerializer(serializers.ModelSerializer):
    software_detail = SoftwareSerializer(source='software', read_only=True)
    solicitante_detail = UsuarioSimpleSerializer(source='solicitante', read_only=True)
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
