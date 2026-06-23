from django.db import transaction
from django.utils import timezone
from apps.core.exceptions import BusinessValidationError
from apps.ativos.models import Ativo, StatusAtivo
from apps.ativos.services import AtivoService
from apps.emprestimos.models import Emprestimo, StatusEmprestimo, StatusConservacao
from apps.usuarios.models import Usuario, Servidor

class EmprestimoService:
    @staticmethod
    @transaction.atomic
    def realizar_emprestimo(ativo: Ativo, usuario: Usuario, autorizado_por: Servidor, data_devolucao_prevista, observacao_saida: str = None) -> Emprestimo:
        """
        Realiza o empréstimo de um ativo para um usuário, validando a elegibilidade do ativo.
        """
        # 1. Valida elegibilidade do ativo
        if not ativo.elegivel_emprestimo:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' (Patrimônio: {ativo.serial_patrimonio}) não é elegível para empréstimo."
            )
            
        # 2. Valida status atual do ativo
        if ativo.status not in [StatusAtivo.DISPONIVEL, StatusAtivo.NOVO]:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' não está disponível para empréstimo. Status atual: {ativo.get_status_display()}."
            )
            
        # 3. Cria o empréstimo
        emprestimo = Emprestimo.objects.create(
            ativo=ativo,
            usuario=usuario,
            autorizado_por=autorizado_por,
            data_saida=timezone.now(),
            data_devolucao_prevista=data_devolucao_prevista,
            status=StatusEmprestimo.ATIVO,
            observacao_saida=observacao_saida
        )
        
        # 4. Atualiza o status do ativo para 'Emprestado' e registra a movimentação
        AtivoService.transferir_ativo(
            ativo=ativo,
            novo_setor=ativo.setor, # Continua no mesmo setor do responsável, porém emprestado
            operador=autorizado_por,
            novo_status=StatusAtivo.EMPRESTADO,
            observacao=f"Ativo emprestado para {usuario.nome} (Matrícula: {usuario.matricula}). Empréstimo ID: {emprestimo.id}."
        )
        
        return emprestimo

    @staticmethod
    @transaction.atomic
    def devolver_ativo(emprestimo: Emprestimo, devolvido_por: Servidor, status_conservacao: str, observacao_devolucao: str = None) -> Emprestimo:
        """
        Registra a devolução de um ativo emprestado, liberando o ativo para novos empréstimos.
        """
        if emprestimo.status != StatusEmprestimo.ATIVO:
            raise BusinessValidationError(
                f"Este empréstimo já se encontra finalizado. Status atual: {emprestimo.get_status_display()}."
            )
            
        # 1. Atualiza dados do empréstimo
        emprestimo.data_devolucao_real = timezone.now()
        emprestimo.status = StatusEmprestimo.DEVOLVIDO
        emprestimo.status_conservacao_retorno = status_conservacao
        emprestimo.observacao_devolucao = observacao_devolucao
        emprestimo.save()
        
        # 2. Retorna o status do ativo para 'Disponivel' e registra movimentação
        AtivoService.transferir_ativo(
            ativo=emprestimo.ativo,
            novo_setor=emprestimo.ativo.setor,
            operador=devolvido_por,
            novo_status=StatusAtivo.DISPONIVEL,
            observacao=f"Ativo devolvido. Empréstimo ID: {emprestimo.id}. Estado de conservação: {status_conservacao}."
        )
        
        return emprestimo
