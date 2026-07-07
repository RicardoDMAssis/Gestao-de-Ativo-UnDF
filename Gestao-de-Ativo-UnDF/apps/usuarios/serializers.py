from rest_framework import serializers
from django.db import transaction
from apps.usuarios.models import Usuario, Aluno, Professor, Servidor, TipoUsuario
from apps.instituicao.serializers import CursoSerializer, SetorSerializer

class SimpleAlunoSerializer(serializers.ModelSerializer):
    curso_detail = CursoSerializer(source='curso', read_only=True)

    class Meta:
        model = Aluno
        fields = ['curso', 'curso_detail', 'semestre']


class SimpleServidorSerializer(serializers.ModelSerializer):
    setor_detail = SetorSerializer(source='setor', read_only=True)

    class Meta:
        model = Servidor
        fields = ['cargo', 'setor', 'setor_detail']


class UsuarioSerializer(serializers.ModelSerializer):
    aluno_detail = serializers.SerializerMethodField()
    servidor_detail = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'matricula', 'tipo_usuario', 'ativo', 'is_superuser', 'aluno_detail', 'servidor_detail', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_aluno_detail(self, obj):
        if hasattr(obj, 'aluno_profile'):
            return SimpleAlunoSerializer(obj.aluno_profile).data
        return None

    def get_servidor_detail(self, obj):
        if hasattr(obj, 'servidor_profile'):
            return SimpleServidorSerializer(obj.servidor_profile).data
        return None


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    aluno_profile = serializers.DictField(write_only=True, required=False)
    professor_profile = serializers.DictField(write_only=True, required=False)
    servidor_profile = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'matricula', 'tipo_usuario', 'ativo', 'password', 'aluno_profile', 'professor_profile', 'servidor_profile']

    @transaction.atomic
    def create(self, validated_data):
        aluno_data = validated_data.pop('aluno_profile', None)
        professor_data = validated_data.pop('professor_profile', None)
        servidor_data = validated_data.pop('servidor_profile', None)
        password = validated_data.pop('password', None)
        
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            matricula=validated_data['matricula'],
            nome=validated_data['nome'],
            tipo_usuario=validated_data['tipo_usuario'],
            password=password,
            ativo=validated_data.get('ativo', True)
        )

        tipo = validated_data.get('tipo_usuario')
        if tipo == TipoUsuario.ALUNO and aluno_data:
            from apps.instituicao.models import Curso
            curso_id = aluno_data.get('curso')
            if curso_id:
                curso = Curso.objects.get(pk=curso_id)
                Aluno.objects.create(usuario=user, curso=curso, semestre=aluno_data.get('semestre', 1))
        elif tipo == TipoUsuario.PROFESSOR and professor_data:
            Professor.objects.create(usuario=user, regime_trabalho=professor_data.get('regime_trabalho', '40h'))
        elif tipo == TipoUsuario.SERVIDOR and servidor_data:
            from apps.instituicao.models import Setor
            setor_id = servidor_data.get('setor')
            if setor_id:
                setor = Setor.objects.get(pk=setor_id)
                Servidor.objects.create(usuario=user, cargo=servidor_data.get('cargo', ''), setor=setor)

        return user


class AlunoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    curso_detail = CursoSerializer(source='curso', read_only=True)

    class Meta:
        model = Aluno
        fields = '__all__'


class AlunoCreateUpdateSerializer(serializers.ModelSerializer):
    usuario_data = UsuarioCreateSerializer(write_only=True, required=False)

    class Meta:
        model = Aluno
        fields = ['usuario_data', 'curso', 'semestre']

    @transaction.atomic
    def update(self, instance, validated_data):
        usuario_data = validated_data.pop('usuario_data', None)
        if usuario_data:
            # Atualiza o Usuário associado
            usuario = instance.usuario
            password = usuario_data.pop('password', None)
            
            for attr, value in usuario_data.items():
                setattr(usuario, attr, value)
            if password:
                usuario.set_password(password)
            usuario.save()

        instance.curso = validated_data.get('curso', instance.curso)
        instance.semestre = validated_data.get('semestre', instance.semestre)
        instance.save()
        return instance


class ProfessorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = Professor
        fields = '__all__'


class ProfessorCreateUpdateSerializer(serializers.ModelSerializer):
    usuario_data = UsuarioCreateSerializer(write_only=True, required=False)

    class Meta:
        model = Professor
        fields = ['usuario_data', 'regime_trabalho']

    @transaction.atomic
    def update(self, instance, validated_data):
        usuario_data = validated_data.pop('usuario_data', None)
        if usuario_data:
            usuario = instance.usuario
            password = usuario_data.pop('password', None)
            
            for attr, value in usuario_data.items():
                setattr(usuario, attr, value)
            if password:
                usuario.set_password(password)
            usuario.save()

        instance.regime_trabalho = validated_data.get('regime_trabalho', instance.regime_trabalho)
        instance.save()
        return instance


class ServidorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    setor_detail = SetorSerializer(source='setor', read_only=True)

    class Meta:
        model = Servidor
        fields = '__all__'


class ServidorCreateUpdateSerializer(serializers.ModelSerializer):
    usuario_data = UsuarioCreateSerializer(write_only=True, required=False)

    class Meta:
        model = Servidor
        fields = ['usuario_data', 'cargo', 'setor']

    @transaction.atomic
    def update(self, instance, validated_data):
        usuario_data = validated_data.pop('usuario_data', None)
        if usuario_data:
            usuario = instance.usuario
            password = usuario_data.pop('password', None)
            
            for attr, value in usuario_data.items():
                setattr(usuario, attr, value)
            if password:
                usuario.set_password(password)
            usuario.save()

        instance.cargo = validated_data.get('cargo', instance.cargo)
        instance.setor = validated_data.get('setor', instance.setor)
        instance.save()
        return instance
