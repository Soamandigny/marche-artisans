from decimal import Decimal

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import TokenAuthentication
from .models import LignePanier, Panier, Produit
from .permissions import EstClient


def panier_du_client(user):
    """Renvoie le panier actif du client connecté (le crée si besoin)."""
    if not hasattr(user, 'client'):
        return None

    panier, _ = Panier.objects.get_or_create(id_client=user.client)

    if panier.statut != 'actif':
        panier.statut = 'actif'
        panier.save(update_fields=['statut'])

    return panier


def profil_manquant():
    return Response(
        {'detail': "Aucun profil client lié à ce compte."},
        status=status.HTTP_400_BAD_REQUEST,
    )


def donnees_panier(panier):
    lignes = (
        panier.lignes
        .select_related('id_produit__id_artisan')
        .order_by('id_ligne_panier')
    )

    total = Decimal('0')
    nombre_articles = 0
    resultat = []

    for ligne in lignes:
        produit = ligne.id_produit
        sous_total = produit.prix * ligne.quantite
        total += sous_total
        nombre_articles += ligne.quantite

        resultat.append({
            'id_ligne_panier': ligne.id_ligne_panier,
            'id_produit': produit.id_produit,
            'nom': produit.nom,
            'image': produit.image,
            'artisan_nom': produit.id_artisan.nom_entreprise,
            'prix': str(produit.prix),
            'stock': produit.stock,
            'quantite': ligne.quantite,
            'sous_total': str(sous_total),
        })

    return {
        'id_panier': panier.id_panier,
        'lignes': resultat,
        'total': str(total),
        'nombre_articles': nombre_articles,
    }


class BasePanierView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [EstClient]


class PanierView(BasePanierView):
    """GET /api/panier/ : le panier du client connecté."""

    def get(self, request):
        panier = panier_du_client(request.user)
        if panier is None:
            return profil_manquant()
        return Response(donnees_panier(panier))


class PanierAjouterView(BasePanierView):
    """POST /api/panier/ajouter/  {id_produit, quantite}"""

    @transaction.atomic
    def post(self, request):
        panier = panier_du_client(request.user)
        if panier is None:
            return profil_manquant()

        try:
            id_produit = int(request.data.get('id_produit'))
            quantite = int(request.data.get('quantite', 1))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Données invalides.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantite < 1:
            return Response(
                {'detail': 'La quantité doit être au moins 1.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            produit = Produit.objects.get(pk=id_produit)
        except Produit.DoesNotExist:
            return Response(
                {'detail': "Ce produit n'existe pas."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ligne = LignePanier.objects.filter(
            id_panier=panier, id_produit=produit
        ).first()

        deja = ligne.quantite if ligne else 0
        nouvelle = deja + quantite

        if produit.stock == 0:
            return Response(
                {'detail': 'Ce produit est en rupture de stock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if nouvelle > produit.stock:
            return Response(
                {
                    'detail': (
                        f"Stock insuffisant : {produit.stock} disponible(s), "
                        f"dont {deja} déjà dans votre panier."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ligne:
            ligne.quantite = nouvelle
            ligne.save(update_fields=['quantite'])
        else:
            LignePanier.objects.create(
                id_panier=panier,
                id_produit=produit,
                quantite=quantite,
            )

        return Response(donnees_panier(panier), status=status.HTTP_201_CREATED)


class PanierLigneView(BasePanierView):
    """PATCH /api/panier/lignes/<id>/ {quantite}   |   DELETE /api/panier/lignes/<id>/"""

    def _ligne(self, request, id_ligne):
        panier = panier_du_client(request.user)
        if panier is None:
            return None, None
        # On filtre par panier : impossible d'atteindre la ligne d'un autre client
        ligne = LignePanier.objects.filter(
            pk=id_ligne, id_panier=panier
        ).select_related('id_produit').first()
        return panier, ligne

    def patch(self, request, id_ligne):
        panier, ligne = self._ligne(request, id_ligne)
        if panier is None:
            return profil_manquant()
        if ligne is None:
            return Response(
                {'detail': 'Ligne introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            quantite = int(request.data.get('quantite'))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Quantité invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantite < 1:
            return Response(
                {'detail': 'La quantité doit être au moins 1.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantite > ligne.id_produit.stock:
            return Response(
                {'detail': f"Stock insuffisant : {ligne.id_produit.stock} disponible(s)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ligne.quantite = quantite
        ligne.save(update_fields=['quantite'])

        return Response(donnees_panier(panier))

    def delete(self, request, id_ligne):
        panier, ligne = self._ligne(request, id_ligne)
        if panier is None:
            return profil_manquant()
        if ligne is None:
            return Response(
                {'detail': 'Ligne introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        ligne.delete()
        return Response(donnees_panier(panier))