from rest_framework import serializers
from apps.instituicao.models import Escola, Campus, Setor, Curso, Sala

class EscolaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escola
        fields = '__all__'


class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = '__all__'


class SetorSerializer(serializers.ModelSerializer):
    campus_detail = CampusSerializer(source='campus', read_only=True)

    class Meta:
        model = Setor
        fields = '__all__'


class SetorCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setor
        fields = '__all__'


class CursoSerializer(serializers.ModelSerializer):
    escola_detail = EscolaSerializer(source='escola', read_only=True)
    campus_detail = CampusSerializer(source='campus', read_only=True)

    class Meta:
        model = Curso
        fields = '__all__'


class CursoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__'


class SalaSerializer(serializers.ModelSerializer):
    campus_detail = CampusSerializer(source='campus', read_only=True)

    class Meta:
        model = Sala
        fields = '__all__'


class SalaCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sala
        fields = '__all__'
