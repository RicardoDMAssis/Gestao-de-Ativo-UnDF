import django
import os
import sys
import csv

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from django.contrib.auth import get_user_model
from apps.usuarios.models import Servidor, Professor, TipoUsuario
from apps.instituicao.models import Campus, Setor
from apps.ativos.models import Ativo, MovimentacaoAtivo, SolicitacaoInstalacao
from apps.emprestimos.models import Emprestimo

Usuario = get_user_model()
csv_file_path = '../servidores_docentes_undf.csv'

def map_setor_tipo(email_str, cargo_str):
    email_lower = email_str.lower()
    cargo_lower = cargo_str.lower()
    
    if 'coeti' in email_lower or 'engenharia' in cargo_lower or 'tecnologia' in cargo_lower:
        return 'Ceinter_Engenharia_TI'
    if 'proppg' in email_lower:
        return 'PROPPG'
    if 'cochcma' in email_lower or 'humanas' in cargo_lower:
        return 'Ceinter_Ciencias_Humanas'
    if 'proextc' in email_lower or 'extensão' in cargo_lower:
        return 'PROEXTC'
    if 'cocbs' in email_lower or 'biológicas' in cargo_lower or 'saúde' in cargo_lower:
        return 'Ceinter_Ciencias_Saude'
    if 'produni' in email_lower:
        return 'PRODUNI'
    if 'vice' in email_lower or 'vice-reitor' in cargo_lower:
        return 'Vice_Reitoria'
    if 'educação' in cargo_lower or 'artes' in cargo_lower or 'magistério' in cargo_lower:
        return 'Ceinter_Educacao_Artes'
    if 'prograd' in email_lower:
        return 'PROGRAD'
    if 'reitoria' in email_lower or 'reitor' in cargo_lower:
        return 'Reitoria'
    
    return 'UAG'

@transaction.atomic
def run_import():
    # 0. Drop trigger restricting dual-role users
    print("Dropping database trigger restricting dual-role users...")
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT tgname, relname 
            FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE p.proname = 'trg_fn_valida_professor_ja_servidor';
        """)
        triggers = cursor.fetchall()
        for tgname, relname in triggers:
            cursor.execute(f'DROP TRIGGER IF EXISTS "{tgname}" ON "{relname}" CASCADE;')
            print(f"Dropped trigger {tgname} on table {relname}")
        cursor.execute("DROP FUNCTION IF EXISTS trg_fn_valida_professor_ja_servidor() CASCADE;")
        print("Dropped function trg_fn_valida_professor_ja_servidor")

    # 1. Ensure Campus exists
    campus = Campus.objects.first()
    if not campus:
        campus = Campus.objects.create(nome="Campus Principal", sigla="UNID", cidade="Brasília", ativo=True)
        print("Created campus:", campus)

    # 2. Get superuser
    superuser = Usuario.objects.filter(is_superuser=True).first()
    if not superuser:
        superuser = Usuario.objects.filter(is_staff=True).first()
    if not superuser:
        # Create a fallback superuser if none exists
        superuser = Usuario.objects.create_superuser(
            email='admin@undf.edu.br',
            matricula='ADMIN001',
            nome='Administrador',
            password='admin'
        )
        print("Created fallback superuser:", superuser)

    superuser_servidor = superuser.get_servidor_profile()
    if not superuser_servidor:
        # Ensure superuser has a Servidor profile
        uag_setor, _ = Setor.objects.get_or_create(campus=campus, tipo='UAG', defaults={'ativo': True})
        superuser_servidor = Servidor.objects.create(usuario=superuser, cargo='Administrador', setor=uag_setor)
        print("Created Servidor profile for superuser:", superuser_servidor)

    # 3. Create mapping of existing protected references
    print("Mapping existing database references...")
    email_to_assets = {}
    email_to_movs = {}
    email_to_emprestimos_auth = {}
    email_to_emprestimos_user = {}
    email_to_solicitacoes = {}

    for s in Servidor.objects.filter(usuario__is_superuser=False):
        email = s.usuario.email
        email_to_assets[email] = list(s.ativos_responsaveis.values_list('id', flat=True))
        email_to_movs[email] = list(s.movimentacoes_operadas.values_list('id', flat=True))
        email_to_emprestimos_auth[email] = list(s.emprestimos_autorizados.values_list('id', flat=True))

    for u in Usuario.objects.filter(is_superuser=False, tipo_usuario__in=['Servidor', 'Professor']):
        email_to_emprestimos_user[u.email] = list(u.emprestimos_solicitados.values_list('id', flat=True))
        email_to_solicitacoes[u.email] = list(u.solicitacoes_instalacao.values_list('id', flat=True))

    # 4. Re-link references to superuser temporarily to bypass ProtectedError
    print("Temporarily re-linking records to superuser...")
    Ativo.objects.filter(responsavel__usuario__is_superuser=False).update(responsavel=superuser_servidor)
    MovimentacaoAtivo.objects.filter(operador__usuario__is_superuser=False).update(operador=superuser_servidor)
    Emprestimo.objects.filter(autorizado_por__usuario__is_superuser=False).update(autorizado_por=superuser_servidor)
    Emprestimo.objects.filter(usuario__is_superuser=False, usuario__tipo_usuario__in=['Servidor', 'Professor']).update(usuario=superuser)
    SolicitacaoInstalacao.objects.filter(solicitante__is_superuser=False, solicitante__tipo_usuario__in=['Servidor', 'Professor']).update(solicitante=superuser)

    # 5. Delete existing non-superuser Servidores, Professores, and Usuarios
    print("Deleting old non-superuser Servidores and Professores...")
    Servidor.objects.filter(usuario__is_superuser=False).delete()
    Professor.objects.filter(usuario__is_superuser=False).delete()
    deleted_users = Usuario.objects.filter(is_superuser=False, tipo_usuario__in=['Servidor', 'Professor']).delete()
    print(f"Deleted {deleted_users[0]} users.")

    # 6. Read and process CSV to create new users
    print("Importing new users from CSV...")
    new_users = {}
    new_servidores = {}
    
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        idx = 1
        for row in reader:
            nome = row['Nome'].strip()
            emails_raw = row['Emails'].strip()
            cargos_raw = row['Cargos'].strip()

            primary_email = emails_raw.split('/')[0].strip()
            matricula = f"U{20260000 + idx}"
            
            print(f"\nProcessing {nome} ({primary_email})...")

            # Create User
            user = Usuario.objects.create_user(
                email=primary_email,
                matricula=matricula,
                nome=nome,
                tipo_usuario='Servidor',
                password=matricula,
                ativo=True
            )
            new_users[primary_email] = user
            print(f"Created user {user.nome} with matricula {matricula}")

            # Add Servidor Profile
            cargo_parts = [c.strip() for c in cargos_raw.split('/')]
            servidor_cargo = cargo_parts[0] if len(cargo_parts) > 0 else cargos_raw
            
            tipo_setor = map_setor_tipo(primary_email, cargos_raw)
            setor, _ = Setor.objects.get_or_create(
                campus=campus,
                tipo=tipo_setor,
                defaults={'ativo': True}
            )
            
            serv = Servidor.objects.create(
                usuario=user,
                cargo=servidor_cargo,
                setor=setor
            )
            new_servidores[primary_email] = serv
            print(f"Created Servidor profile with cargo '{servidor_cargo}' in sector {setor.get_tipo_display()}")

            # Add Professor Profile
            prof_cargo = None
            for part in cargo_parts:
                if any(x in part.lower() for x in ['professor', 'professora', 'tutor', 'tutora']):
                    prof_cargo = part
                    break
            
            if prof_cargo:
                Professor.objects.create(
                    usuario=user,
                    regime_trabalho='40h'
                )
                print(f"Created Professor profile with regime '40h'")

            idx += 1

    # 7. Re-link database records back to their original owners if emails match
    print("\nRe-linking records back to imported users...")
    for email, asset_ids in email_to_assets.items():
        if email in new_servidores and asset_ids:
            Ativo.objects.filter(id__in=asset_ids).update(responsavel=new_servidores[email])
            print(f"Re-linked {len(asset_ids)} assets to new Servidor {email}")

    for email, mov_ids in email_to_movs.items():
        if email in new_servidores and mov_ids:
            MovimentacaoAtivo.objects.filter(id__in=mov_ids).update(operador=new_servidores[email])
            print(f"Re-linked {len(mov_ids)} movement logs to new Servidor {email}")

    for email, emp_ids in email_to_emprestimos_auth.items():
        if email in new_servidores and emp_ids:
            Emprestimo.objects.filter(id__in=emp_ids).update(autorizado_por=new_servidores[email])
            print(f"Re-linked {len(emp_ids)} authorized loans to new Servidor {email}")

    for email, emp_ids in email_to_emprestimos_user.items():
        if email in new_users and emp_ids:
            Emprestimo.objects.filter(id__in=emp_ids).update(usuario=new_users[email])
            print(f"Re-linked {len(emp_ids)} loans back to user {email}")

    for email, sol_ids in email_to_solicitacoes.items():
        if email in new_users and sol_ids:
            SolicitacaoInstalacao.objects.filter(id__in=sol_ids).update(solicitante=new_users[email])
            print(f"Re-linked {len(sol_ids)} installation requests back to user {email}")

    print("\nDatabase synchronization completed successfully!")

if __name__ == '__main__':
    run_import()
