from rest_framework import serializers
from django.db import transaction
from apps.usuarios.models import Usuario, Aluno, Professor, Servidor, TipoUsuario
from apps.instituicao.serializers import CursoSerializer, SetorSerializer

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'matricula', 'tipo_usuario', 'ativo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'matricula', 'tipo_usuario', 'ativo', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            matricula=validated_data['matricula'],
            nome=validated_data['nome'],
            tipo_usuario=validated_data['tipo_usuario'],
            password=password,
            ativo=validated_data.get('ativo', True)
        )
        return user


class AlunoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    curso_detail = CursoSerializer(source='curso', read_only=True)

    class Meta:
        model = Aluno
        fields = '__all__'


class AlunoCreateUpdateSerializer(serializers.ModelSerializer):
    usuario_data = UsuarioCreateSerializer(write_only=True, required=True)

    class Meta:
        model = Aluno
        fields = ['usuario_data', 'curso', 'semestre']

    @transaction.atomic
    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario_data')
        usuario_data['tipo_usuario'] = TipoUsuario.ALUNO
        
        # Cria o Usuário associado
        user_serializer = UsuarioCreateSerializer(data=usuario_data)
        user_serializer.is_valid(raise_exception=True)
        usuario = user_serializer.save()
        
        # Cria o Perfil do Aluno
        aluno = Aluno.objects.create(
            usuario=usuario,
            curso=validated_data['curso'],
            semestre=validated_data['semestre']
        )
        return aluno

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
    usuario_data = UsuarioCreateSerializer(write_only=True, required=True)

    class Meta:
        model = Professor
        fields = ['usuario_data', 'regime_trabalho']

    @transaction.atomic
    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario_data')
        usuario_data['tipo_usuario'] = TipoUsuario.PROFESSOR
        
        user_serializer = UsuarioCreateSerializer(data=usuario_data)
        user_serializer.is_valid(raise_exception=True)
        usuario = user_serializer.save()
        
        professor = Professor.objects.create(
            usuario=usuario,
            regime_trabalho=validated_data['regime_trabalho']
        )
        return professor

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
    usuario_data = UsuarioCreateSerializer(write_only=True, required=True)

    class Meta:
        model = Servidor
        fields = ['usuario_data', 'cargo', 'setor']

    @transaction.atomic
    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario_data')
        usuario_data['tipo_usuario'] = TipoUsuario.SERVIDOR
        
        user_serializer = UsuarioCreateSerializer(data=usuario_data)
        user_serializer.is_valid(raise_exception=True)
        usuario = user_serializer.save()
        
        servidor = Servidor.objects.create(
            usuario=usuario,
            cargo=validated_data['cargo'],
            setor=validated_data['setor']
        )
        return servidor

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
