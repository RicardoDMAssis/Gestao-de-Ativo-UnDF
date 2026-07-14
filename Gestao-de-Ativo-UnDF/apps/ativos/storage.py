"""
Serviço de Storage do Supabase para upload de imagens dos ativos.

Utiliza o client Python oficial `supabase-py` para comunicação com o
Supabase Storage. As credenciais são lidas a partir das settings Django,
que por sua vez as leem das variáveis de ambiente.

Bucket padrão: settings.SUPABASE_STORAGE_BUCKET (ex: 'ativos-imagem')

O bucket deve ser criado manualmente no Supabase Dashboard com visibilidade
pública (ou privada com geração de URLs assinadas conforme sua política).
"""
import uuid
import mimetypes
from django.conf import settings
from supabase import create_client, Client
from apps.core.exceptions import BusinessValidationError

# Tipos MIME permitidos para upload de imagem
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _get_supabase_client() -> Client:
    """Retorna um client Supabase autenticado com a service role key (bypass RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)


class SupabaseStorageService:
    """
    Gerencia o ciclo de vida de imagens de ativos no Supabase Storage.

    Todos os métodos são estáticos e operam no bucket configurado em
    settings.SUPABASE_STORAGE_BUCKET.
    """

    @staticmethod
    def upload_imagem(file, ativo_id: int) -> tuple[str, str]:
        """
        Faz upload de um arquivo de imagem para o Supabase Storage.

        Args:
            file: objeto de arquivo Django (InMemoryUploadedFile ou similar).
            ativo_id: ID do ativo — usado para organizar os arquivos no bucket.

        Returns:
            Tupla (public_url, storage_key) onde:
              - public_url: URL pública acessível diretamente pelo navegador.
              - storage_key: caminho relativo no bucket (usado para deletar depois).

        Raises:
            BusinessValidationError: se o tipo ou tamanho do arquivo for inválido.
        """
        # ── Validações ─────────────────────────────────────────────────────────
        content_type = getattr(file, 'content_type', None) or mimetypes.guess_type(file.name)[0]
        if content_type not in ALLOWED_MIME_TYPES:
            raise BusinessValidationError(
                f"Tipo de arquivo não permitido: '{content_type}'. "
                f"Permitidos: {', '.join(ALLOWED_MIME_TYPES)}."
            )

        file.seek(0, 2)  # Vai para o fim do arquivo
        file_size = file.tell()
        file.seek(0)     # Volta ao início
        if file_size > MAX_FILE_SIZE_BYTES:
            raise BusinessValidationError(
                f"Arquivo muito grande: {file_size / 1024 / 1024:.1f} MB. "
                f"Máximo permitido: {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            )

        # ── Gera chave única para o arquivo ─────────────────────────────────
        extension = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else 'jpg'
        storage_key = f"ativos/{ativo_id}/{uuid.uuid4().hex}.{extension}"

        # ── Upload para o Supabase Storage ──────────────────────────────────
        client = _get_supabase_client()
        bucket = settings.SUPABASE_STORAGE_BUCKET

        try:
            client.storage.from_(bucket).upload(
                path=storage_key,
                file=file.read(),
                file_options={"content-type": content_type, "upsert": "false"},
            )
        except Exception as exc:
            raise BusinessValidationError(
                f"Falha no upload para o Supabase Storage: {exc}"
            )

        # ── Obtém a URL pública ──────────────────────────────────────────────
        public_url = SupabaseStorageService.get_public_url(storage_key)
        return public_url, storage_key

    @staticmethod
    def upload_perfil(file, user_id: int) -> tuple[str, str]:
        """
        Faz upload de uma foto de perfil para o Supabase Storage.
        """
        content_type = getattr(file, 'content_type', None) or mimetypes.guess_type(file.name)[0]
        if content_type not in ALLOWED_MIME_TYPES:
            raise BusinessValidationError(
                f"Tipo de arquivo não permitido: '{content_type}'. "
                f"Permitidos: {', '.join(ALLOWED_MIME_TYPES)}."
            )

        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise BusinessValidationError(
                f"Arquivo muito grande: {file_size / 1024 / 1024:.1f} MB. "
                f"Máximo permitido: {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            )

        extension = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else 'jpg'
        storage_key = f"perfis/{user_id}/{uuid.uuid4().hex}.{extension}"

        client = _get_supabase_client()
        bucket = 'fotos-perfil'

        try:
            client.storage.from_(bucket).upload(
                path=storage_key,
                file=file.read(),
                file_options={"content-type": content_type, "upsert": "false"},
            )
        except Exception as exc:
            raise BusinessValidationError(
                f"Falha no upload para o Supabase Storage: {exc}"
            )

        public_url = SupabaseStorageService.get_public_url(storage_key, bucket=bucket)
        return public_url, storage_key

    @staticmethod
    def delete_imagem(storage_key: str, bucket: str = None) -> None:
        """
        Remove uma imagem do Supabase Storage.

        Args:
            storage_key: caminho relativo no bucket (conforme retornado por upload_imagem).
            bucket: nome do bucket (se omitido, usa SUPABASE_STORAGE_BUCKET)

        Silencia erros de arquivo não encontrado (idempotente).
        """
        if not storage_key:
            return

        client = _get_supabase_client()
        if not bucket:
            bucket = settings.SUPABASE_STORAGE_BUCKET

        try:
            client.storage.from_(bucket).remove([storage_key])
        except Exception:
            # Log pode ser adicionado aqui se houver um logger configurado
            pass

    @staticmethod
    def get_public_url(storage_key: str, bucket: str = None) -> str:
        """
        Retorna a URL pública de um objeto no Supabase Storage.

        Args:
            storage_key: caminho relativo no bucket.
            bucket: nome do bucket (se omitido, usa SUPABASE_STORAGE_BUCKET)

        Returns:
            URL pública como string.
            """
        client = _get_supabase_client()
        if not bucket:
            bucket = settings.SUPABASE_STORAGE_BUCKET
        response = client.storage.from_(bucket).get_public_url(storage_key)
        return response

    @staticmethod
    def upload_software_imagem(file, software_id: int) -> tuple[str, str]:
        """
        Faz upload de uma imagem (png ou svg) de software para o Supabase Storage.
        """
        content_type = getattr(file, 'content_type', None) or mimetypes.guess_type(file.name)[0]
        allowed_types = ['image/png', 'image/svg+xml']
        if content_type not in allowed_types:
            raise BusinessValidationError(
                f"Tipo de arquivo não permitido: '{content_type}'. "
                f"Permitidos: PNG e SVG."
            )

        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise BusinessValidationError(
                f"Arquivo muito grande. Máximo permitido: 5 MB."
            )

        extension = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else 'png'
        storage_key = f"softwares/{software_id}/{uuid.uuid4().hex}.{extension}"

        client = _get_supabase_client()
        bucket = 'fotos-softwares'

        try:
            client.storage.from_(bucket).upload(
                path=storage_key,
                file=file.read(),
                file_options={"content-type": content_type, "upsert": "false"},
            )
        except Exception as exc:
            raise BusinessValidationError(
                f"Falha no upload para o Supabase Storage: {exc}"
            )

        public_url = SupabaseStorageService.get_public_url(storage_key, bucket=bucket)
        return public_url, storage_key
