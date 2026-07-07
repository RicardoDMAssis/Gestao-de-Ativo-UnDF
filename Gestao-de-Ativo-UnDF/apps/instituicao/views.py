from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view
from apps.core.permissions import IsServidor
from apps.instituicao.models import Escola, Campus, Setor, Curso, Sala
from apps.instituicao.serializers import (
    EscolaSerializer,
    CampusSerializer,
    SetorSerializer,
    SetorCreateUpdateSerializer,
    CursoSerializer,
    CursoCreateUpdateSerializer,
    SalaSerializer,
    SalaCreateUpdateSerializer
)

from django.db.models import ProtectedError
from rest_framework.exceptions import ValidationError

class BaseInstitutionViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsServidor()]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            raise ValidationError(
                "Não é possível excluir este registro porque existem outras informações vinculadas a ele."
            )


@extend_schema_view(
    list=extend_schema(tags=['Escolas']),
    retrieve=extend_schema(tags=['Escolas']),
    create=extend_schema(tags=['Escolas']),
    update=extend_schema(tags=['Escolas']),
    partial_update=extend_schema(tags=['Escolas']),
    destroy=extend_schema(tags=['Escolas']),
)
class EscolaViewSet(BaseInstitutionViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    queryset = Escola.objects.all().order_by('nome')
    serializer_class = EscolaSerializer
    filterset_fields = ['sigla']
    search_fields = ['nome', 'sigla']


@extend_schema_view(
    list=extend_schema(tags=['Campi']),
    retrieve=extend_schema(tags=['Campi']),
    create=extend_schema(tags=['Campi']),
    update=extend_schema(tags=['Campi']),
    partial_update=extend_schema(tags=['Campi']),
    destroy=extend_schema(tags=['Campi']),
)
class CampusViewSet(BaseInstitutionViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    queryset = Campus.objects.all().order_by('nome')
    serializer_class = CampusSerializer
    filterset_fields = ['sigla', 'cidade']
    search_fields = ['nome', 'sigla', 'cidade']


@extend_schema_view(
    list=extend_schema(tags=['Setores']),
    retrieve=extend_schema(tags=['Setores']),
    create=extend_schema(tags=['Setores']),
    update=extend_schema(tags=['Setores']),
    partial_update=extend_schema(tags=['Setores']),
    destroy=extend_schema(tags=['Setores']),
)
class SetorViewSet(BaseInstitutionViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    queryset = Setor.objects.all().order_by('id')
    filterset_fields = ['campus', 'tipo']
    search_fields = ['email', 'campus__nome', 'campus__sigla']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SetorCreateUpdateSerializer
        return SetorSerializer


@extend_schema_view(
    list=extend_schema(tags=['Cursos']),
    retrieve=extend_schema(tags=['Cursos']),
    create=extend_schema(tags=['Cursos']),
    update=extend_schema(tags=['Cursos']),
    partial_update=extend_schema(tags=['Cursos']),
    destroy=extend_schema(tags=['Cursos']),
)
class CursoViewSet(BaseInstitutionViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    queryset = Curso.objects.all().order_by('nome')
    filterset_fields = ['escola', 'campus']
    search_fields = ['nome', 'sigla', 'escola__nome', 'campus__nome']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CursoCreateUpdateSerializer
        return CursoSerializer


@extend_schema_view(
    list=extend_schema(tags=['Salas / Laboratórios']),
    retrieve=extend_schema(tags=['Salas / Laboratórios']),
    create=extend_schema(tags=['Salas / Laboratórios']),
    update=extend_schema(tags=['Salas / Laboratórios']),
    partial_update=extend_schema(tags=['Salas / Laboratórios']),
    destroy=extend_schema(tags=['Salas / Laboratórios']),
)
class SalaViewSet(BaseInstitutionViewSet):
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    queryset = Sala.objects.all().order_by('numero')
    filterset_fields = ['campus', 'tipo']
    search_fields = ['numero', 'campus__nome', 'campus__sigla']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SalaCreateUpdateSerializer
        return SalaSerializer
