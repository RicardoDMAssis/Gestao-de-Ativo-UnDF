"""
Management command: marcar_emprestimos_atrasados

Identifica empréstimos com status 'Ativo' cuja data de devolução prevista
já passou e os marca como 'Atrasado'.

Uso:
    python manage.py marcar_emprestimos_atrasados

Agendamento (cron — exemplo com crontab no servidor):
    # Executa todo dia à meia-noite
    0 0 * * * /path/to/venv/bin/python /app/manage.py marcar_emprestimos_atrasados
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.emprestimos.models import Emprestimo, StatusEmprestimo


class Command(BaseCommand):
    help = (
        "Verifica todos os empréstimos ativos com data de devolução vencida "
        "e atualiza o status para 'Atrasado'."
    )

    def handle(self, *args, **options):
        agora = timezone.now()

        emprestimos_vencidos = Emprestimo.objects.filter(
            status=StatusEmprestimo.ATIVO,
            data_devolucao_prevista__lt=agora,
        )

        total = emprestimos_vencidos.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS("Nenhum empréstimo em atraso encontrado."))
            return

        # Bulk update para não disparar N queries individuais
        linhas_atualizadas = emprestimos_vencidos.update(
            status=StatusEmprestimo.ATRASADO,
        )

        self.stdout.write(
            self.style.WARNING(
                f"{linhas_atualizadas} empréstimo(s) marcado(s) como ATRASADO."
            )
        )

        # Lista os IDs para rastreabilidade nos logs
        ids = list(emprestimos_vencidos.values_list('id', flat=True))
        # Reavaliar após update (o queryset lazy já foi executado acima)
        ids_atualizados = list(
            Emprestimo.objects.filter(
                status=StatusEmprestimo.ATRASADO,
                data_devolucao_prevista__lt=agora,
            ).values_list('id', flat=True)[:linhas_atualizadas]
        )
        self.stdout.write(f"IDs afetados: {ids_atualizados}")
