from decimal import Decimal

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import TokenAuthentication
from .models import (
    Commande,
    LignePanier,
    LigneCommande,
    Livraison,
    Panier,
    Paiement,
    Produit,
)
from .permissions import EstClient

MODES_VALIDES = [code for code, _ in Paiement.MODE_CHOICES]


def donnees_commande(c):
    lignes = []
    for l in c.lignes.select_related('id_produit').order_by('id_ligne_commande'):
        lignes.append({
            'id_produit': l.id_produit.id_produit,
            'nom': l.id_produit.nom,
            'image': l.id_produit.image,
            'quantite': l.quantite,
            'prix_unitaire': str(l.prix_unitaire),
            'sous_total': str(l.prix_unitaire * l.quantite),
        })

    paiement = getattr(c, 'paiement', None)
    livraison = getattr(c, 'livraison', None)

    return {
        'id_commande': c.id_commande,
        'date_commande': c.date_commande,
        'montant_total': str(c.montant_total),
        'statut': c.statut,
        'statut_label': c.get_statut_display(),
        'adresse_livraison': c.adresse_livraison,
        'paiement': {
            'mode': paiement.mode_paiement,
            'mode_label': paiement.get_mode_paiement_display(),
            'statut': paiement.statut,
            'statut_label': paiement.get_statut_display(),
        } if paiement else None,
        'livraison': {
            'statut': livraison.statut,
            'statut_label': livraison.get_statut_display(),
        } if livraison else None,
        'lignes': lignes,
    }


def erreur(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': message}, status=code)


class BaseClientView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [EstClient]


class CommanderView(BaseClientView):
    """POST /api/commander/  {adresse_livraison, mode_paiement}"""

    @transaction.atomic
    def post(self, request):
        client = getattr(request.user, 'client', None)
        if client is None:
            return erreur("Aucun profil client lié à ce compte.")

        adresse = (request.data.get('adresse_livraison') or '').strip()
        mode = request.data.get('mode_paiement') or ''

        if len(adresse) < 5:
            return erreur("Veuillez saisir une adresse de livraison complète.")
        if len(adresse) > 255:
            return erreur("L'adresse est trop longue (255 caractères maximum).")
        if mode not in MODES_VALIDES:
            return erreur("Mode de paiement invalide.")

        panier = Panier.objects.filter(id_client=client).first()
        lignes = []
        if panier:
            lignes = list(
                LignePanier.objects.filter(id_panier=panier)
                .select_related('id_produit')
                .order_by('id_ligne_panier')
            )

        if not lignes:
            return erreur("Votre panier est vide.")

        # Verrouille les produits pendant la commande (évite le sur-achat)
        ids = [l.id_produit_id for l in lignes]
        produits = {
            p.pk: p
            for p in Produit.objects.select_for_update().filter(pk__in=ids)
        }

        # Vérification du stock, avec les valeurs à jour
        problemes = []
        for l in lignes:
            p = produits[l.id_produit_id]
            if l.quantite > p.stock:
                problemes.append(
                    f"« {p.nom} » : {p.stock} disponible(s), "
                    f"{l.quantite} demandé(s)."
                )
        if problemes:
            return erreur(
                "Stock insuffisant. " + " ".join(problemes)
                + " Modifiez votre panier."
            )

        # Le total est calculé ici, avec les prix de la base
        total = sum(
            (produits[l.id_produit_id].prix * l.quantite for l in lignes),
            Decimal('0'),
        )

        commande = Commande.objects.create(
            id_client=client,
            montant_total=total,
            adresse_livraison=adresse,
        )

        for l in lignes:
            p = produits[l.id_produit_id]
            LigneCommande.objects.create(
                id_commande=commande,
                id_produit=p,
                quantite=l.quantite,
                prix_unitaire=p.prix,  # prix figé au moment de l'achat
            )
            p.stock -= l.quantite
            p.save(update_fields=['stock'])

        Paiement.objects.create(
            id_commande=commande,
            montant=total,
            mode_paiement=mode,
        )

        Livraison.objects.create(
            id_commande=commande,
            adresse=adresse,
        )

        # Le panier est vidé
        LignePanier.objects.filter(id_panier=panier).delete()

        commande.refresh_from_db()
        return Response(
            donnees_commande(commande),
            status=status.HTTP_201_CREATED,
        )


class MesCommandesView(BaseClientView):
    """GET /api/mes-commandes/ : les commandes du client connecté."""

    def get(self, request):
        client = getattr(request.user, 'client', None)
        if client is None:
            return erreur("Aucun profil client lié à ce compte.")

        commandes = Commande.objects.filter(id_client=client)
        return Response([donnees_commande(c) for c in commandes])


class MaCommandeView(BaseClientView):
    """GET /api/mes-commandes/<id>/ : une commande du client connecté."""

    def get(self, request, id_commande):
        client = getattr(request.user, 'client', None)
        if client is None:
            return erreur("Aucun profil client lié à ce compte.")

        # Filtré par client : impossible de lire la commande d'un autre
        commande = Commande.objects.filter(
            pk=id_commande, id_client=client
        ).first()

        if commande is None:
            return erreur("Commande introuvable.", status.HTTP_404_NOT_FOUND)

        return Response(donnees_commande(commande))