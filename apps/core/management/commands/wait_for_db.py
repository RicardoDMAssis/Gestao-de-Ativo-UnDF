import time
from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError

class Command(BaseCommand):
    help = 'Aguarda o banco de dados estar disponível antes de continuar.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Aguardando banco de dados...')
        db_conn = None
        attempts = 0
        max_attempts = 30

        while not db_conn and attempts < max_attempts:
            try:
                db_conn = connections['default']
                db_conn.ensure_connection()
            except OperationalError:
                attempts += 1
                self.stdout.write(f'  Banco não disponível. Tentativa {attempts}/{max_attempts}. Aguardando 1s...')
                time.sleep(1)
                db_conn = None

        if not db_conn:
            self.stderr.write(self.style.ERROR('Banco de dados não ficou disponível a tempo. Abortando.'))
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS('Banco de dados disponível!'))
