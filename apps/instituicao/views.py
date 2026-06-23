from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsServidor
from apps.instituicao.models import Escola, Campus, Setor, Curso
from apps.instituicao.serializers import (
    EscolaSerializer,
    CampusSerializer,
    SetorSerializer,
    SetorCreateUpdateSerializer,
    CursoSerializer,
    CursoCreateUpdateSerializer
)

class EscolaViewSet(viewsets.ModelViewSet):
    queryset = Escola.objects.all().order_by('nome')
    serializer_class = EscolaSerializer
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['sigla']
    search_fields = ['nome', 'sigla']


class CampusViewSet(viewsets.ModelViewSet):
    queryset = Campus.objects.all().order_by('nome')
    serializer_class = CampusSerializer
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['sigla', 'cidade']
    search_fields = ['nome', 'sigla', 'cidade']


class SetorViewSet(viewsets.ModelViewSet):
    queryset = Setor.objects.all().order_by('id')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['campus', 'tipo']
    search_fields = ['email', 'campus__nome', 'campus__sigla']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SetorCreateUpdateSerializer
        return SetorSerializer


class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all().order_by('nome')
    permission_classes = [IsAuthenticated, IsServidor]
    filterset_fields = ['escola', 'campus']
    search_fields = ['nome', 'sigla', 'escola__nome', 'campus__nome']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CursoCreateUpdateSerializer
        return CursoSerializer
