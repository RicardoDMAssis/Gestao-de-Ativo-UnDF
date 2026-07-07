from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from apps.core.models import TimestampedModel
from apps.instituicao.models import Curso, Setor

class TipoUsuario(models.TextChoices):
    ALUNO = 'Aluno', 'Aluno'
    PROFESSOR = 'Professor', 'Professor'
    SERVIDOR = 'Servidor', 'Servidor'


class UsuarioManager(BaseUserManager):
    def create_user(self, email, matricula, nome, tipo_usuario, password=None, **extra_fields):
        if not email:
            raise ValueError('O Usuário deve ter um endereço de e-mail.')
        if not matricula:
            raise ValueError('O Usuário deve ter uma matrícula.')
        
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            matricula=matricula,
            nome=nome,
            tipo_usuario=tipo_usuario,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_password(matricula)
            
        user.save(using=self._db)
        return user

    def create_superuser(self, email, matricula, nome, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('tipo_usuario', TipoUsuario.SERVIDOR)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser deve ter is_superuser=True.')

        return self.create_user(email, matricula, nome, password=password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin, TimestampedModel):
    nome = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    matricula = models.CharField(max_length=50, unique=True)
    tipo_usuario = models.CharField(max_length=50, choices=TipoUsuario.choices)
    ativo = models.BooleanField(default=True)
    
    # Campos necessários para o Django Admin e Auth
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True) # Mapeia para o controle de login do Django

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome', 'matricula', 'tipo_usuario']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return f"{self.nome} ({self.matricula})"

    @property
    def is_aluno(self):
        return self.tipo_usuario == TipoUsuario.ALUNO

    @property
    def is_professor(self):
        return self.tipo_usuario == TipoUsuario.PROFESSOR

    @property
    def is_servidor(self):
        return self.tipo_usuario == TipoUsuario.SERVIDOR

    def get_servidor_profile(self):
        try:
            return self.servidor_profile
        except models.ObjectDoesNotExist:
            if self.is_superuser:
                from apps.usuarios.models import Servidor
                from apps.instituicao.models import Setor
                setor = Setor.objects.first()
                if not setor:
                    from apps.instituicao.models import Campus
                    campus = Campus.objects.first()
                    if not campus:
                        campus = Campus.objects.create(nome="Campus Provisório", sigla="PROV", cidade="Brasília", ativo=True)
                    setor = Setor.objects.create(nome="Administração", tipo="Administrativo", campus=campus, ativo=True)
                
                profile, _ = Servidor.objects.get_or_create(
                    usuario=self,
                    defaults={'cargo': 'Super Administrador', 'setor': setor}
                )
                return profile
            return None


class Aluno(TimestampedModel):
    # Relacionamento OneToOne atuando como PK/FK para mapear a herança de tabelas
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='usuario_id',
        related_name='aluno_profile'
    )
    curso = models.ForeignKey(
        Curso,
        on_delete=models.PROTECT,
        db_column='curso_id',
        related_name='alunos'
    )
    semestre = models.SmallIntegerField()

    class Meta:
        db_table = 'alunos'
        verbose_name = 'Aluno'
        verbose_name_plural = 'Alunos'

    def __str__(self):
        return f"Aluno: {self.usuario.nome} - Curso: {self.curso.sigla}"


class Professor(TimestampedModel):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='usuario_id',
        related_name='professor_profile'
    )
    regime_trabalho = models.CharField(max_length=100) # ex: DE (Dedicação Exclusiva), 40h, 20h

    class Meta:
        db_table = 'professores'
        verbose_name = 'Professor'
        verbose_name_plural = 'Professores'

    def __str__(self):
        return f"Prof. {self.usuario.nome} ({self.regime_trabalho})"


class Servidor(TimestampedModel):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='usuario_id',
        related_name='servidor_profile'
    )
    cargo = models.CharField(max_length=150)
    setor = models.ForeignKey(
        Setor,
        on_delete=models.PROTECT,
        db_column='setor_id',
        related_name='servidores'
    )

    class Meta:
        db_table = 'servidores'
        verbose_name = 'Servidor'
        verbose_name_plural = 'Servidores'

    def __str__(self):
        return f"Servidor: {self.usuario.nome} - Cargo: {self.cargo}"
