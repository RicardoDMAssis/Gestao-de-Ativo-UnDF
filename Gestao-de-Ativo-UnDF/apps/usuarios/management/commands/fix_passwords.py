from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario

class Command(BaseCommand):
    help = 'Define a senha dos usuários não-superusers como a matrícula caso não possuam senha utilizável'

    def handle(self, *args, **options):
        usuarios = Usuario.objects.filter(is_superuser=False)
        updated_count = 0
        for usuario in usuarios:
            usuario.set_password(usuario.matricula)
            usuario.save()
            updated_count += 1
            self.stdout.write(self.style.SUCCESS(f'Senha definida para a matrícula para o usuário: {usuario.email}'))
        
        self.stdout.write(self.style.SUCCESS(f'Total de {updated_count} usuários atualizados.'))
