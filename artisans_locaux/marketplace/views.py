from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .auth import TokenAuthentication
from .permissions import (
    EstAdmin,
    EstArtisan,
    LectureSeuleOuAdmin,
    LectureSeuleOuArtisan,
)

from .models import (
    Utilisateur,
    Artisan,
    Client,
    Categorie,
    Produit,
    Panier,
    LignePanier,
    Commande,
    LigneCommande,
    Paiement,
    Livraison,
)

from .serializers import (
    UtilisateurSerializer,
    ArtisanSerializer,
    ClientSerializer,
    CategorieSerializer,
    ProduitSerializer,
    PanierSerializer,
    LignePanierSerializer,
    CommandeSerializer,
    LigneCommandeSerializer,
    PaiementSerializer,
    LivraisonSerializer,
)


# BASE : réservé à l'administrateur

class AdminSeulViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [EstAdmin]


# UTILISATEUR (lecture seule : les comptes se créent via l'inscription)

class UtilisateurViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [EstAdmin]


# ARTISAN

class ArtisanViewSet(AdminSeulViewSet):
    queryset = Artisan.objects.all()
    serializer_class = ArtisanSerializer


# CLIENT

class ClientViewSet(AdminSeulViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


# CATEGORIE : lecture libre, écriture admin

class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [LectureSeuleOuAdmin]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    'detail': (
                        "Cette catégorie contient des produits : "
                        "elle ne peut pas être supprimée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


# PRODUIT : lecture libre, écriture artisan (ses produits uniquement)

class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.select_related('id_artisan', 'id_categorie')
    serializer_class = ProduitSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [LectureSeuleOuArtisan]

    def perform_create(self, serializer):
        user = self.request.user

        if not hasattr(user, 'artisan'):
            raise ValidationError({
                'detail': "Aucun profil artisan lié à ce compte. "
                          "Un admin doit créer le produit depuis l'admin Django."
            })

        serializer.save(id_artisan=user.artisan)

    @action(
        detail=False,
        methods=['get'],
        url_path='mes-produits',
        permission_classes=[EstArtisan],
    )
    def mes_produits(self, request):
        """GET /api/produits/mes-produits/ : les produits de l'artisan connecté."""
        produits = self.get_queryset()
        artisan = getattr(request.user, 'artisan', None)

        if artisan is not None:
            produits = produits.filter(id_artisan=artisan)

        return Response(self.get_serializer(produits, many=True).data)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    'detail': (
                        "Ce produit figure dans des commandes : il ne peut pas "
                        "être supprimé. Mettez son stock à 0 pour ne plus le vendre."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


# Phase 5 : routes réservées à l'administrateur côté API générique
# (les clients passent par /api/panier/, /api/commander/, /api/mes-commandes/).

class PanierViewSet(AdminSeulViewSet):
    queryset = Panier.objects.all()
    serializer_class = PanierSerializer


class LignePanierViewSet(AdminSeulViewSet):
    queryset = LignePanier.objects.all()
    serializer_class = LignePanierSerializer


class CommandeViewSet(AdminSeulViewSet):
    queryset = Commande.objects.all()
    serializer_class = CommandeSerializer


class LigneCommandeViewSet(AdminSeulViewSet):
    queryset = LigneCommande.objects.all()
    serializer_class = LigneCommandeSerializer


class PaiementViewSet(AdminSeulViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer


class LivraisonViewSet(AdminSeulViewSet):
    queryset = Livraison.objects.all()
    serializer_class = LivraisonSerializer