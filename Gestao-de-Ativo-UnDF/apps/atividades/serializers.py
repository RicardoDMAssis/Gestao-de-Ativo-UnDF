from rest_framework import serializers
from apps.atividades.models import AtividadeAcademica
from apps.usuarios.serializers import AlunoSerializer

class AtividadeAcademicaSerializer(serializers.ModelSerializer):
    aluno_detail = AlunoSerializer(source='aluno', read_only=True)

    class Meta:
        model = AtividadeAcademica
        fields = '__all__'


class AtividadeAcademicaCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtividadeAcademica
        fields = '__all__'

    def validate(self, attrs):
        tipo = attrs.get('tipo')
        numero_processo = attrs.get('numero_processo')
        if tipo and tipo != 'Monitoria' and not numero_processo:
            raise serializers.ValidationError({
                'numero_processo': 'O número do processo é obrigatório para atividades que não sejam Monitoria.'
            })
        return attrs
