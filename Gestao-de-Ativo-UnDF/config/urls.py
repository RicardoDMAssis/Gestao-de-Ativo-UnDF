from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.utils import extend_schema, extend_schema_view

@extend_schema_view(post=extend_schema(tags=['Autenticação']))
class TaggedTokenObtainPairView(TokenObtainPairView):
    pass

@extend_schema_view(post=extend_schema(tags=['Autenticação']))
class TaggedTokenRefreshView(TokenRefreshView):
    pass
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# Importando ViewSets
from apps.instituicao.views import EscolaViewSet, CampusViewSet, SetorViewSet, CursoViewSet, SalaViewSet
from apps.usuarios.views import UsuarioViewSet, AlunoViewSet, ProfessorViewSet, ServidorViewSet
from apps.ativos.views import (
    AtivoViewSet,
    AtivoTIViewSet,
    SoftwareViewSet,
    InstalacaoSoftwareViewSet,
    MovimentacaoAtivoViewSet,
    SolicitacaoInstalacaoViewSet
)
from apps.emprestimos.views import EmprestimoViewSet
from apps.atividades.views import AtividadeAcademicaViewSet

router = DefaultRouter()

# Rotas Institucionais
router.register(r'escolas', EscolaViewSet, basename='escola')
router.register(r'campi', CampusViewSet, basename='campus')
router.register(r'setores', SetorViewSet, basename='setor')
router.register(r'cursos', CursoViewSet, basename='curso')
router.register(r'salas', SalaViewSet, basename='sala')

# Rotas de Usuários
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'alunos', AlunoViewSet, basename='aluno')
router.register(r'professores', ProfessorViewSet, basename='professor')
router.register(r'servidores', ServidorViewSet, basename='servidor')

# Rotas de Patrimônio / Ativos
router.register(r'ativos', AtivoViewSet, basename='ativo')
router.register(r'ativos-ti', AtivoTIViewSet, basename='ativo-ti')
router.register(r'softwares', SoftwareViewSet, basename='software')
router.register(r'instalacoes-software', InstalacaoSoftwareViewSet, basename='instalacao-software')
router.register(r'movimentacoes-ativo', MovimentacaoAtivoViewSet, basename='movimentacao-ativo')
router.register(r'solicitacoes-instalacao', SolicitacaoInstalacaoViewSet, basename='solicitacao-instalacao')

# Rotas de Empréstimos e Atividades
router.register(r'emprestimos', EmprestimoViewSet, basename='emprestimo')
router.register(r'atividades-academicas', AtividadeAcademicaViewSet, basename='atividade-academica')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Prefixado com api/ para organização
    path('api/', include(router.urls)),
    
    # Autenticação JWT
    path('api/auth/token/', TaggedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TaggedTokenRefreshView.as_view(), name='token_refresh'),
    
    # Documentação Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
