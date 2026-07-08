import sys
from pathlib import Path
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Adiciona o diretório 'apps' ao python path para facilitar importações se necessário
sys.path.insert(0, str(BASE_DIR / 'apps'))

# Inicializa o django-environ
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1', '0.0.0.0']),
)

# Tenta ler o arquivo .env se ele existir
environ.Env.read_env(env_file=str(BASE_DIR / '.env'))

SECRET_KEY = env('SECRET_KEY')

DEBUG = env('DEBUG')

ALLOWED_HOSTS = env('ALLOWED_HOSTS')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Bibliotecas de Terceiros
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'drf_spectacular',
    'corsheaders',

    # Nossas Apps
    'apps.core',
    'apps.instituicao',
    'apps.usuarios',
    'apps.ativos',
    'apps.emprestimos',
    'apps.atividades',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',          # Deve vir antes do CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


DATABASES = {
    'default': env.db_url('DATABASE_URL')
}
# Desabilita prepared statements (server-side cursors) para compatibilidade com o PgBouncer do Supabase (porta 6543)
DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True


# Custom User Model
AUTH_USER_MODEL = 'usuarios.Usuario'


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ─── Django REST Framework ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}


# ─── JWT Settings ─────────────────────────────────────────────────────────────
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=env.int('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7)),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': env.str('JWT_SECRET_KEY', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ─── CORS ─────────────────────────────────────────────────────────────────────
# Em produção, substitua CORS_ALLOW_ALL_ORIGINS=False e liste as origens permitidas.
CORS_ALLOW_ALL_ORIGINS = env.bool('CORS_ALLOW_ALL_ORIGINS', default=True if DEBUG else False)
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_CREDENTIALS = True


# ─── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL = env('SUPABASE_URL')
SUPABASE_PUBLISHABLE_KEY = env('SUPABASE_PUBLISHABLE_KEY')
SUPABASE_SECRET_KEY = env('SUPABASE_SECRET_KEY')
SUPABASE_STORAGE_BUCKET = env('SUPABASE_STORAGE_BUCKET', default='ativos-imagens')


# ─── Swagger / OpenAPI ────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'API de Gestão de Patrimônio Universitário',
    'DESCRIPTION': 'Documentação da API REST para o sistema de gestão de patrimônio da universidade.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'ENUM_NAME_OVERRIDES': {
        'StatusAtivoEnum': 'apps.ativos.models.StatusAtivo',
        'StatusEmprestimoEnum': 'apps.emprestimos.models.StatusEmprestimo',
        'StatusConservacaoEnum': 'apps.emprestimos.models.StatusConservacao',
        'StatusAtividadeEnum': 'apps.atividades.models.StatusAtividade',
        'TipoAtividadeEnum': 'apps.atividades.models.TipoAtividade',
        'TipoSetorEnum': 'apps.instituicao.models.TipoSetor',
        'TipoUsuarioEnum': 'apps.usuarios.models.TipoUsuario',
    },
}
