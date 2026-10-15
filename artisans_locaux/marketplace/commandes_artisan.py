from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import TokenAuthentication
from .commandes import erreur
from .models import Commande, Produit
from .permissions import EstArtisan

TRANSITIONS = {
    'en_attente': ['confirmee', 'annulee'],
    'confirmee': ['preparee', 'annulee'],
    'preparee': ['expediee', 'annulee'],
    'expediee': ['livree'],
    'livree': [],
    'annulee': [],
}

STATUT_LIVRAISON = {
    'preparee': 'preparee',
    'expediee': 'expediee',
    'livree': 'livree',
}


def _commande_complete(pk):
    return (
        Commande.objects
        .select_related('id_client__id_utilisateur', 'paiement', 'livraison')
        .get(pk=pk)
    )


def donnees_artisan(c, artisan):
    toutes = list(
        c.lignes.select_related('id_produit').order_by('id_ligne_commande')
    )

    if artisan is not None:
        siennes = [l for l in toutes if l.id_produit.id_artisan_id == artisan.pk]
    else:
        siennes = toutes

    gerable = len(siennes) == len(toutes)

    paiement = getattr(c, 'paiement', None)
    livraison = getattr(c, 'livraison', None)
    u = c.id_client.id_utilisateur

    return {
        'id_commande': c.id_commande,
        'date_commande': c.date_commande,
        'statut': c.statut,
        'statut_label': c.get_statut_display(),
        'client': f"{u.prenom} {u.nom}",
        'adresse_livraison': c.adresse_livraison,
        'montant': str(sum((l.prix_unitaire * l.quantite for l in siennes), 0)),
        'lignes': [{
            'id_produit': l.id_produit.id_produit,
            'nom': l.id_produit.nom,
            'image': l.id_produit.image,
            'quantite': l.quantite,
            'prix_unitaire': str(l.prix_unitaire),
            'sous_total': str(l.prix_unitaire * l.quantite),
        } for l in siennes],
        'paiement': {
            'mode_label': paiement.get_mode_paiement_display(),
            'statut': paiement.statut,
            'statut_label': paiement.get_statut_display(),
        } if paiement else None,
        'livraison': {
            'statut': livraison.statut,
            'statut_label': livraison.get_statut_display(),
        } if livraison else None,
        'gerable': gerable,
        'actions': TRANSITIONS.get(c.statut, []) if gerable else [],
    }


class CommandesRecuesView(APIView):
    """GET /api/artisan/commandes/"""

    authentication_classes = [TokenAuthentication]
    permission_classes = [EstArtisan]

    def get(self, request):
        artisan = getattr(request.user, 'artisan', None)

        commandes = Commande.objects.select_related(
            'id_client__id_utilisateur', 'paiement', 'livraison'
        )
        if artisan is not None:
            commandes = commandes.filter(
                lignes__id_produit__id_artisan=artisan
            ).distinct()

        return Response([donnees_artisan(c, artisan) for c in commandes])


class ChangerStatutView(APIView):
    """POST /api/artisan/commandes/<id>/statut/  {statut}"""

    authentication_classes = [TokenAuthentication]
    permission_classes = [EstArtisan]

    @transaction.atomic
    def post(self, request, id_commande):
        artisan = getattr(request.user, 'artisan', None)
        nouveau = request.data.get('statut')

        commande = (
            Commande.objects.select_for_update()
            .filter(pk=id_commande)
            .first()
        )
        if commande is None:
            return erreur("Commande introuvable.", status.HTTP_404_NOT_FOUND)

        lignes = list(commande.lignes.select_related('id_produit'))

        if artisan is not None:
            siennes = [l for l in lignes if l.id_produit.id_artisan_id == artisan.pk]
            if not siennes:
                # On ne révèle pas l'existence de la commande d'un autre
                return erreur("Commande introuvable.", status.HTTP_404_NOT_FOUND)
            if len(siennes) != len(lignes):
                return erreur(
                    "Cette commande contient aussi des produits d'autres "
                    "artisans : son statut est géré par l'administrateur.",
                    status.HTTP_403_FORBIDDEN,
                )

        if nouveau not in TRANSITIONS.get(commande.statut, []):
            return erreur(
                "Changement de statut impossible depuis "
                f"« {commande.get_statut_display()} »."
            )

        paiement = getattr(commande, 'paiement', None)
        livraison = getattr(commande, 'livraison', None)

        # Pas de confirmation tant qu'un paiement en ligne n'est pas réglé
        if (
            nouveau == 'confirmee'
            and paiement
            and paiement.mode_paiement in ('mobile_money', 'carte')
            and paiement.statut != 'paye'
        ):
            return erreur(
                "Le paiement en ligne de cette commande n'est pas encore réglé."
            )

        if nouveau == 'annulee':
            # Remise en stock (produits verrouillés pendant l'opération)
            ids = [l.id_produit_id for l in lignes]
            produits = {
                p.pk: p
                for p in Produit.objects.select_for_update().filter(pk__in=ids)
            }
            for l in lignes:
                p = produits[l.id_produit_id]
                p.stock += l.quantite
                p.save(update_fields=['stock'])

            if paiement and paiement.statut == 'paye':
                paiement.statut = 'rembourse'
                paiement.save(update_fields=['statut'])

        if livraison and nouveau in STATUT_LIVRAISON:
            livraison.statut = STATUT_LIVRAISON[nouveau]
            if nouveau == 'expediee':
                livraison.date_expedition = timezone.now()
            if nouveau == 'livree':
                livraison.date_livraison = timezone.now()
            livraison.save()

        # Espèces : encaissées à la livraison
        if (
            nouveau == 'livree'
            and paiement
            and paiement.mode_paiement == 'especes'
            and paiement.statut == 'en_attente'
        ):
            paiement.statut = 'paye'
            paiement.save(update_fields=['statut'])

        commande.statut = nouveau
        commande.save(update_fields=['statut'])

        return Response(
            donnees_artisan(_commande_complete(commande.pk), artisan)
        )