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
