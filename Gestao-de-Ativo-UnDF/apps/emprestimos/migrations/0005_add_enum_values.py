from django.db import migrations

class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('emprestimos', '0004_alter_emprestimo_autorizado_por_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TYPE status_emprestimo_enum ADD VALUE IF NOT EXISTS 'Pendente';",
            reverse_sql=""
        ),
        migrations.RunSQL(
            sql="ALTER TYPE status_emprestimo_enum ADD VALUE IF NOT EXISTS 'Finalizado';",
            reverse_sql=""
        ),
    ]
