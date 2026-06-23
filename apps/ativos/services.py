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
from apps.instituicao.models import Setor
from apps.usuarios.models import Servidor

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
