import pytest
import factory
from django.test import TestCase
from apps.instituicao.models import Campus, Escola, Setor, Curso, TipoSetor
from apps.usuarios.models import Usuario, Servidor, Aluno, TipoUsuario
from apps.ativos.models import Ativo, AtivoTI, Software, InstalacaoSoftware, StatusAtivo
from apps.emprestimos.models import Emprestimo, StatusEmprestimo
from apps.ativos.services import AtivoService, SoftwareService
from apps.emprestimos.services import EmprestimoService
from apps.core.exceptions import BusinessValidationError

# Nota: os enums foram alinhados com o DBML:
#   StatusAtivo.EM_MANUTENCAO → StatusAtivo.AVARIADO
#   StatusEmprestimo.DEVOLVIDO → StatusEmprestimo.CONCLUIDO
#   TipoSetor: enum completo com setores reais da UnDF


# ─── Factories ────────────────────────────────────────────────────────────────

class CampusFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Campus

    nome = factory.Sequence(lambda n: f'Campus {n}')
    sigla = factory.Sequence(lambda n: f'CAM{n}')
    cidade = 'Cidade Teste'


class EscolaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Escola

    nome = factory.Sequence(lambda n: f'Escola {n}')
    sigla = factory.Sequence(lambda n: f'ESC{n}')


class SetorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Setor

    campus = factory.SubFactory(CampusFactory)
    tipo = TipoSetor.UAG_PATRIMONIO  # Usa setor real da UnDF (Diretoria de Patrimônio)
    email = factory.Sequence(lambda n: f'setor{n}@universidade.br')


class CursoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Curso

    escola = factory.SubFactory(EscolaFactory)
    campus = factory.SubFactory(CampusFactory)
    nome = factory.Sequence(lambda n: f'Curso {n}')
    sigla = factory.Sequence(lambda n: f'CUR{n}')


class UsuarioFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Usuario

    nome = factory.Sequence(lambda n: f'Usuário {n}')
    email = factory.Sequence(lambda n: f'usuario{n}@teste.com')
    matricula = factory.Sequence(lambda n: f'MAT{n:05d}')
    tipo_usuario = TipoUsuario.SERVIDOR
    ativo = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return model_class.objects.create_user(
            email=kwargs['email'],
            matricula=kwargs['matricula'],
            nome=kwargs['nome'],
            tipo_usuario=kwargs['tipo_usuario'],
            password='senha_teste_123',
        )


class ServidorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Servidor

    usuario = factory.SubFactory(UsuarioFactory, tipo_usuario=TipoUsuario.SERVIDOR)
    cargo = 'Técnico Administrativo'
    setor = factory.SubFactory(SetorFactory)


class AlunoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Aluno

    usuario = factory.SubFactory(UsuarioFactory, tipo_usuario=TipoUsuario.ALUNO)
    curso = factory.SubFactory(CursoFactory)
    semestre = 1


class AtivoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Ativo

    serial_patrimonio = factory.Sequence(lambda n: f'PAT{n:06d}')
    nome = factory.Sequence(lambda n: f'Ativo {n}')
    categoria = 'Computador'
    status = StatusAtivo.DISPONIVEL
    elegivel_emprestimo = True
    setor = factory.SubFactory(SetorFactory)
    responsavel = factory.SubFactory(ServidorFactory)


class AtivoTIFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AtivoTI

    ativo = factory.SubFactory(AtivoFactory)
    marca = 'Dell'
    memoria_ram_gb = 16
    armazenamento_gb = 512
    sistema_operacional = 'Ubuntu 22.04'


class SoftwareFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Software

    nome = factory.Sequence(lambda n: f'Software {n}')
    fabricante = 'Fabricante Teste'
    total_licencas_compradas = 5


# ─── Testes de Empréstimo ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEmprestimoService:
    def test_realizar_emprestimo_com_sucesso(self):
        """Deve criar o empréstimo e atualizar o status do ativo para Emprestado."""
        servidor = ServidorFactory()
        usuario = UsuarioFactory(tipo_usuario=TipoUsuario.ALUNO)
        ativo = AtivoFactory(status=StatusAtivo.DISPONIVEL, elegivel_emprestimo=True)
        from django.utils import timezone
        data_prev = timezone.now() + timezone.timedelta(days=7)

        emprestimo = EmprestimoService.realizar_emprestimo(
            ativo=ativo,
            usuario=usuario,
            autorizado_por=servidor,
            data_devolucao_prevista=data_prev,
        )

        ativo.refresh_from_db()
        assert emprestimo.status == StatusEmprestimo.ATIVO
        assert ativo.status == StatusAtivo.EMPRESTADO

    def test_nao_permite_emprestimo_ativo_nao_elegivel(self):
        """Deve lançar erro ao tentar emprestar ativo não elegível."""
        servidor = ServidorFactory()
        usuario = UsuarioFactory(tipo_usuario=TipoUsuario.ALUNO)
        ativo = AtivoFactory(status=StatusAtivo.DISPONIVEL, elegivel_emprestimo=False)
        from django.utils import timezone
        data_prev = timezone.now() + timezone.timedelta(days=7)

        with pytest.raises(BusinessValidationError):
            EmprestimoService.realizar_emprestimo(
                ativo=ativo,
                usuario=usuario,
                autorizado_por=servidor,
                data_devolucao_prevista=data_prev,
            )

    def test_nao_permite_emprestimo_ativo_indisponivel(self):
        """Deve lançar erro ao tentar emprestar ativo avariado (antigo Em_Manutencao)."""
        servidor = ServidorFactory()
        usuario = UsuarioFactory(tipo_usuario=TipoUsuario.ALUNO)
        # StatusAtivo.AVARIADO substituiu EM_MANUTENCAO após alinhamento com DBML
        ativo = AtivoFactory(status=StatusAtivo.AVARIADO, elegivel_emprestimo=True)
        from django.utils import timezone
        data_prev = timezone.now() + timezone.timedelta(days=7)

        with pytest.raises(BusinessValidationError):
            EmprestimoService.realizar_emprestimo(
                ativo=ativo,
                usuario=usuario,
                autorizado_por=servidor,
                data_devolucao_prevista=data_prev,
            )

    def test_devolver_ativo_com_sucesso(self):
        """Deve registrar devolução e liberar o ativo."""
        servidor = ServidorFactory()
        usuario = UsuarioFactory(tipo_usuario=TipoUsuario.ALUNO)
        ativo = AtivoFactory(status=StatusAtivo.DISPONIVEL, elegivel_emprestimo=True)
        from django.utils import timezone
        data_prev = timezone.now() + timezone.timedelta(days=7)

        emprestimo = EmprestimoService.realizar_emprestimo(
            ativo=ativo, usuario=usuario, autorizado_por=servidor,
            data_devolucao_prevista=data_prev,
        )

        emprestimo_devolvido = EmprestimoService.devolver_ativo(
            emprestimo=emprestimo,
            devolvido_por=servidor,
            status_conservacao='Bom',
            observacao_devolucao='Devolvido em perfeitas condições.',
        )

        ativo.refresh_from_db()
        # StatusEmprestimo.CONCLUIDO substituiu DEVOLVIDO após alinhamento com DBML
        assert emprestimo_devolvido.status == StatusEmprestimo.CONCLUIDO
        assert emprestimo_devolvido.data_devolucao_real is not None
        assert ativo.status == StatusAtivo.DISPONIVEL

    def test_nao_permite_devolver_emprestimo_ja_encerrado(self):
        """Deve lançar erro ao tentar devolver um empréstimo já encerrado."""
        servidor = ServidorFactory()
        usuario = UsuarioFactory(tipo_usuario=TipoUsuario.ALUNO)
        ativo = AtivoFactory(status=StatusAtivo.DISPONIVEL, elegivel_emprestimo=True)
        from django.utils import timezone
        data_prev = timezone.now() + timezone.timedelta(days=7)

        emprestimo = EmprestimoService.realizar_emprestimo(
            ativo=ativo, usuario=usuario, autorizado_por=servidor,
            data_devolucao_prevista=data_prev,
        )
        # Primeira devolução
        EmprestimoService.devolver_ativo(emprestimo=emprestimo, devolvido_por=servidor, status_conservacao='Bom')

        # Segunda devolução — deve falhar
        with pytest.raises(BusinessValidationError):
            EmprestimoService.devolver_ativo(emprestimo=emprestimo, devolvido_por=servidor, status_conservacao='Bom')


# ─── Testes de Licença de Software ───────────────────────────────────────────

@pytest.mark.django_db
class TestSoftwareService:
    def test_instalar_software_com_sucesso(self):
        """Deve instalar software em ativo TI quando há licenças disponíveis."""
        software = SoftwareFactory(total_licencas_compradas=3)
        ativo_ti = AtivoTIFactory()

        instalacao = SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti)

        assert instalacao.software == software
        assert instalacao.ativo_ti == ativo_ti

    def test_nao_permite_instalar_alem_do_limite_de_licencas(self):
        """Deve lançar erro quando o número de licenças é atingido."""
        software = SoftwareFactory(total_licencas_compradas=2)
        ativo_ti_1 = AtivoTIFactory()
        ativo_ti_2 = AtivoTIFactory()
        ativo_ti_3 = AtivoTIFactory()

        SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti_1)
        SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti_2)

        # Terceira instalação além do limite
        with pytest.raises(BusinessValidationError):
            SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti_3)

    def test_nao_permite_instalar_software_duplicado(self):
        """Deve lançar erro ao tentar instalar o mesmo software duas vezes no mesmo ativo."""
        software = SoftwareFactory(total_licencas_compradas=10)
        ativo_ti = AtivoTIFactory()

        SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti)

        with pytest.raises(BusinessValidationError):
            SoftwareService.instalar_software(software=software, ativo_ti=ativo_ti)


# ─── Testes de Movimentação de Ativo ─────────────────────────────────────────

@pytest.mark.django_db
class TestAtivoService:
    def test_transferir_ativo_registra_movimentacao(self):
        """Deve atualizar o setor e registrar a movimentação automaticamente."""
        servidor = ServidorFactory()
        ativo = AtivoFactory(status=StatusAtivo.DISPONIVEL)
        novo_setor = SetorFactory()

        movimentacao = AtivoService.transferir_ativo(
            ativo=ativo,
            novo_setor=novo_setor,
            operador=servidor,
            novo_status=StatusAtivo.EM_USO,
            observacao='Transferência de teste.',
        )

        ativo.refresh_from_db()
        assert ativo.setor == novo_setor
        assert ativo.status == StatusAtivo.EM_USO  # EM_USO mantido como extensão do DBML
        assert movimentacao.status_anterior == StatusAtivo.DISPONIVEL
        assert movimentacao.status_novo == StatusAtivo.EM_USO
        assert movimentacao.setor == novo_setor
        assert movimentacao.operador == servidor
