from django.db import transaction
from django.utils import timezone
from apps.core.exceptions import BusinessValidationError
from apps.ativos.models import Ativo, StatusAtivo
from apps.ativos.services import AtivoService, SETORES_JURISDICAO_GLOBAL
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
        if not ativo.elegivel_emprestimo or (hasattr(ativo, 'ti_profile') and ativo.ti_profile and ativo.ti_profile.sala and ativo.ti_profile.sala.tipo == 'Laboratorio'):
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' (Patrimônio: {ativo.serial_patrimonio}) não é elegível para empréstimo ou está alocado em um laboratório."
            )
            
        # 2. Valida status atual do ativo e Garantia de Posse Única
        if ativo.status != StatusAtivo.NOVO:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' não está disponível para empréstimo. Status atual: {ativo.get_status_display()}."
            )
        
        if ativo.emprestado:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' já possui um empréstimo ativo."
            )

        # 3. Consistência Temporal
        data_saida = timezone.now()
        if data_devolucao_prevista <= data_saida:
            raise BusinessValidationError("A data de devolução prevista deve ser maior que a data de saída.")

        # 4. Integridade Topológica
        if autorizado_por.setor.campus != ativo.setor.campus and autorizado_por.setor.tipo not in SETORES_JURISDICAO_GLOBAL:
            raise BusinessValidationError(
                f"Operação negada: O servidor autorizador pertence ao campus {autorizado_por.setor.campus.sigla}, "
                f"mas o ativo está no campus {ativo.setor.campus.sigla}."
            )
            
        # 3. Cria o Empréstimo diretamente (ativo)
        emprestimo = Emprestimo.objects.create(
            ativo=ativo,
            usuario=usuario,
            autorizado_por=autorizado_por,
            data_saida=data_saida,
            data_devolucao_prevista=data_devolucao_prevista,
            status=StatusEmprestimo.ATIVO,
            observacao_saida=observacao_saida
        )
        
        # 4. Atualiza o status do ativo para 'Emprestado' e registra a movimentação
        ativo.emprestado = True
        ativo.save()
        
        AtivoService.transferir_ativo(
            ativo=ativo,
            novo_setor=ativo.setor, # Continua no mesmo setor do responsável, porém emprestado
            operador=autorizado_por,
            novo_status=StatusAtivo.NOVO,
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
            
        # 1. Consistência Temporal
        data_devolucao_real = timezone.now()
        if data_devolucao_real < emprestimo.data_saida:
            raise BusinessValidationError("A data de devolução real não pode ser anterior à data de saída do empréstimo.")

        # 2. Atualiza dados do empréstimo
        emprestimo.data_devolucao_real = data_devolucao_real
        emprestimo.status = StatusEmprestimo.CONCLUIDO
        emprestimo.status_conservacao_retorno = status_conservacao
        emprestimo.observacao_devolucao = observacao_devolucao
        emprestimo.save()
        
        # 2. Retorna o status do ativo para 'Disponivel' e registra movimentação
        ativo = emprestimo.ativo
        ativo.emprestado = False
        
        novo_status_conservacao = StatusAtivo.NOVO
        if status_conservacao in [StatusAtivo.AVARIADO, StatusAtivo.DESEMPOSSADO]:
            novo_status_conservacao = status_conservacao
        ativo.status = novo_status_conservacao
        ativo.save()

        AtivoService.transferir_ativo(
            ativo=ativo,
            novo_setor=ativo.setor,
            operador=devolvido_por,
            novo_status=novo_status_conservacao,
            observacao=f"Ativo devolvido. Empréstimo ID: {emprestimo.id}. Estado de conservação: {status_conservacao}."
        )
        
        return emprestimo

    @staticmethod
    @transaction.atomic
    def solicitar_emprestimo(ativo: Ativo, usuario: Usuario, data_devolucao_prevista, observacao_saida: str = None) -> Emprestimo:
        """
        Cria uma solicitação de empréstimo (Pendente) para aprovação por servidores.
        """
        # 1. Valida elegibilidade do ativo
        if not ativo.elegivel_emprestimo:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' (Patrimônio: {ativo.serial_patrimonio}) não é elegível para empréstimo."
            )
            
        # 2. Valida status atual do ativo
        if ativo.status != StatusAtivo.NOVO:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' não está disponível para empréstimo. Status atual: {ativo.get_status_display()}."
            )
        
        if ativo.emprestado:
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' já se encontra emprestado."
            )
        
        # Evita solicitações duplicadas se já existir ativo/pendente para este ativo
        if Emprestimo.objects.filter(ativo=ativo, status__in=[StatusEmprestimo.ATIVO, StatusEmprestimo.PENDENTE]).exists():
            raise BusinessValidationError(
                f"O ativo '{ativo.nome}' já possui um empréstimo ativo ou solicitação pendente."
            )

        # 3. Consistência Temporal
        data_solicitacao = timezone.now()
        if data_devolucao_prevista < data_solicitacao:
            raise BusinessValidationError("A data de devolução prevista não pode ser anterior à data atual.")

        # 4. Validação de Atividade Acadêmica para Alunos
        if getattr(usuario, 'is_aluno', False):
            from apps.atividades.models import AtividadeAcademica, StatusAtividade
            has_atividade = AtividadeAcademica.objects.filter(
                aluno__usuario=usuario,
                status=StatusAtividade.EM_ANDAMENTO,
                aprovada=True
            ).exists()
            if not has_atividade:
                raise BusinessValidationError("Apenas alunos envolvidos em alguma atividade acadêmica ativa E aprovada podem solicitar empréstimos.")

        # 4. Cria solicitação pendente
        emprestimo = Emprestimo.objects.create(
            ativo=ativo,
            usuario=usuario,
            data_devolucao_prevista=data_devolucao_prevista,
            status=StatusEmprestimo.PENDENTE,
            observacao_saida=observacao_saida
        )
        return emprestimo

    @staticmethod
    @transaction.atomic
    def aprovar_emprestimo(emprestimo: Emprestimo, autorizado_por: Servidor) -> Emprestimo:
        """
        Aprova uma solicitação pendente de empréstimo.
        """
        if emprestimo.status != StatusEmprestimo.PENDENTE:
            raise BusinessValidationError("Apenas empréstimos pendentes podem ser aprovados.")

        # Integridade Topológica (mesmo check do realizar_emprestimo)
        if autorizado_por.setor.campus != emprestimo.ativo.setor.campus and autorizado_por.setor.tipo not in SETORES_JURISDICAO_GLOBAL:
            raise BusinessValidationError(
                f"Operação negada: O servidor autorizador pertence ao campus {autorizado_por.setor.campus.sigla}, "
                f"mas o ativo está no campus {emprestimo.ativo.setor.campus.sigla}."
            )

        # Atualiza status e data de saída
        emprestimo.autorizado_por = autorizado_por
        emprestimo.data_saida = timezone.now()
        emprestimo.status = StatusEmprestimo.ATIVO
        emprestimo.save()

        # Atualiza status do ativo para Emprestado e registra movimentação
        ativo = emprestimo.ativo
        ativo.emprestado = True
        ativo.save()

        AtivoService.transferir_ativo(
            ativo=ativo,
            novo_setor=ativo.setor,
            operador=autorizado_por,
            novo_status=StatusAtivo.NOVO,
            observacao=f"Solicitação aprovada por {autorizado_por.usuario.nome}. Ativo emprestado para {emprestimo.usuario.nome}."
        )

        return emprestimo

    @staticmethod
    @transaction.atomic
    def rejeitar_emprestimo(emprestimo: Emprestimo, operador: Servidor, observacao_rejeicao: str = None) -> Emprestimo:
        """
        Rejeita e cancela uma solicitação pendente de empréstimo.
        """
        if emprestimo.status != StatusEmprestimo.PENDENTE:
            raise BusinessValidationError("Apenas empréstimos pendentes podem ser rejeitados.")

        emprestimo.status = StatusEmprestimo.FINALIZADO
        emprestimo.observacao_devolucao = f"Solicitação rejeitada por {operador.usuario.nome}. Motivo: {observacao_rejeicao or 'Não especificado'}"
        emprestimo.save()

        return emprestimo
