from django.db import transaction
from django.utils import timezone
from apps.core.exceptions import BusinessValidationError
from apps.ativos.models import (
    Ativo,
    AtivoTI,
    Software,
    InstalacaoSoftware,
    MovimentacaoAtivo,
    StatusAtivo
)
from apps.instituicao.models import Setor, TipoSetor
from apps.usuarios.models import Servidor

SETORES_JURISDICAO_GLOBAL = [
    TipoSetor.CONSELHOS_SUPERIORES, TipoSetor.REITORIA, TipoSetor.VICE_REITORIA,
    TipoSetor.PROCURADORIA_JURIDICA, TipoSetor.CONTROLADORIA_SETORIAL, TipoSetor.OUVIDORIA,
    TipoSetor.UAG, TipoSetor.UAG_PATRIMONIO, TipoSetor.UAG_CONTRATOS, TipoSetor.UAG_FINANCEIRO,
    TipoSetor.UAG_GESTAO_PESSOAS, TipoSetor.UAG_COMPRAS, TipoSetor.UAG_ARQUIVO,
]

class AtivoService:
    @staticmethod
    @transaction.atomic
    def registrar_movimentacao(ativo: Ativo, operador: Servidor, status_anterior: str, status_novo: str, setor: Setor, observacao: str = None) -> MovimentacaoAtivo:
        """
        Registra uma movimentação no histórico de um ativo.
        """
        movimentacao = MovimentacaoAtivo.objects.create(
            ativo=ativo,
            operador=operador,
            status_anterior=status_anterior,
            status_novo=status_novo,
            setor=setor,
            observacao=observacao,
            registrado_em=timezone.now()
        )
        return movimentacao

    @classmethod
    @transaction.atomic
    def transferir_ativo(cls, ativo: Ativo, novo_setor: Setor, operador: Servidor, novo_status: str = None, observacao: str = None) -> MovimentacaoAtivo:
        """
        Transfere um ativo para um novo setor e/ou altera seu status, 
        registrando automaticamente no histórico de movimentações.
        """
        # Validação Topológica
        if operador.setor.campus != ativo.setor.campus and operador.setor.tipo not in SETORES_JURISDICAO_GLOBAL:
            raise BusinessValidationError(
                f"Operação negada: O operador pertence ao campus {operador.setor.campus.sigla}, "
                f"mas o ativo está no campus {ativo.setor.campus.sigla}. Apenas setores da administração central podem operar intercampi."
            )

        status_anterior = ativo.status
        status_novo = novo_status if novo_status else ativo.status
        
        # Atualiza o ativo
        ativo.setor = novo_setor
        ativo.status = status_novo
        ativo.save()
        
        # Registra a movimentação
        return cls.registrar_movimentacao(
            ativo=ativo,
            operador=operador,
            status_anterior=status_anterior,
            status_novo=status_novo,
            setor=novo_setor,
            observacao=observacao
        )


class SoftwareService:
    @staticmethod
    @transaction.atomic
    def instalar_software(software: Software, ativo_ti: AtivoTI) -> InstalacaoSoftware:
        """
        Registra a instalação de um software em um ativo de TI se houver licenças disponíveis.
        """
        # Verifica se o software já está instalado neste ativo de TI
        ja_instalado = InstalacaoSoftware.objects.filter(
            software=software,
            ativo_ti=ativo_ti
        ).exists()
        if ja_instalado:
            raise BusinessValidationError(
                f"O software '{software.nome}' já está instalado no ativo de TI '{ativo_ti.ativo.nome}'."
            )
            
        # Conta a quantidade de instalações atuais do software
        instalacoes_ativas = InstalacaoSoftware.objects.filter(software=software).count()
        
        # Valida limite de licenças
        if instalacoes_ativas >= software.total_licencas_compradas:
            raise BusinessValidationError(
                f"Limite de licenças atingido para o software '{software.nome}'. "
                f"Instalações ativas: {instalacoes_ativas}, Total compradas: {software.total_licencas_compradas}."
            )
        
        # Registra a instalação
        instalacao = InstalacaoSoftware.objects.create(
            software=software,
            ativo_ti=ativo_ti,
            data_instalacao=timezone.now().date(),
            created_at=timezone.now()
        )
        return instalacao

    @staticmethod
    @transaction.atomic
    def processar_solicitacao_instalacao(solicitacao, aprovado: bool, operador: Servidor, observacao: str = None):
        """
        Processa (Aprova ou Rejeita) uma solicitação de instalação de software.
        """
        from apps.ativos.models import StatusSolicitacaoInstalacao
        
        if solicitacao.status != StatusSolicitacaoInstalacao.PENDENTE:
            raise BusinessValidationError("Esta solicitação já foi processada.")
            
        if aprovado:
            software = solicitacao.software
            # Se for para sala/laboratório
            if solicitacao.sala:
                computadores = AtivoTI.objects.filter(sala=solicitacao.sala)
                if not computadores.exists():
                    raise BusinessValidationError(f"Não existem computadores de TI vinculados à sala '{solicitacao.sala.numero}'.")
                
                # Valida se há licenças suficientes para toda a sala
                instalacoes_ativas = InstalacaoSoftware.objects.filter(software=software).count()
                licencas_disponiveis = software.total_licencas_compradas - instalacoes_ativas
                if computadores.count() > licencas_disponiveis:
                    raise BusinessValidationError(
                        f"Não há licenças suficientes. Computadores na sala: {computadores.count()}, "
                        f"Licenças disponíveis: {licencas_disponiveis}."
                    )
                
                # Efetua a instalação em todos
                for comp in computadores:
                    if not InstalacaoSoftware.objects.filter(software=software, ativo_ti=comp).exists():
                        SoftwareService.instalar_software(software=software, ativo_ti=comp)
            # Se for para computador individual
            elif solicitacao.ativo_ti:
                SoftwareService.instalar_software(software=software, ativo_ti=solicitacao.ativo_ti)
                
            solicitacao.status = StatusSolicitacaoInstalacao.APROVADA
        else:
            solicitacao.status = StatusSolicitacaoInstalacao.REJEITADA
            
        solicitacao.observacao = f"Processada por {operador.usuario.nome}. " + (observacao or "")
        solicitacao.save()
        return solicitacao
