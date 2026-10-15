from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from .commandes import BaseClientView, donnees_commande, erreur
from .models import Commande

MODES_EN_LIGNE = ('mobile_money', 'carte')


class PayerView(BaseClientView):
    """POST /api/mes-commandes/<id>/payer/  {numero?, simuler?}"""

    @transaction.atomic
    def post(self, request, id_commande):
        client = getattr(request.user, 'client', None)
        if client is None:
            return erreur("Aucun profil client lié à ce compte.")

        # Filtré par client + verrouillé : pas de double paiement
        commande = (
            Commande.objects.select_for_update()
            .filter(pk=id_commande, id_client=client)
            .first()
        )
        if commande is None:
            return erreur("Commande introuvable.", status.HTTP_404_NOT_FOUND)

        paiement = getattr(commande, 'paiement', None)
        if paiement is None:
            return erreur("Aucun paiement lié à cette commande.")

        if commande.statut == 'annulee':
            return erreur("Cette commande est annulée.")

        if paiement.statut == 'paye':
            return erreur("Cette commande est déjà payée.")

        if paiement.statut == 'rembourse':
            return erreur("Ce paiement a été remboursé.")

        if paiement.mode_paiement not in MODES_EN_LIGNE:
            return erreur("Ce mode de paiement ne se règle pas en ligne.")

        if paiement.mode_paiement == 'mobile_money':
            numero = ''.join(
                c for c in str(request.data.get('numero') or '') if c.isdigit()
            )
            if len(numero) != 10:
                return erreur(
                    "Saisissez un numéro Mobile Money valide (10 chiffres)."
                )
            # Le numéro n'est pas enregistré : simulation uniquement

        # Échec simulé : accepté seulement en développement
        echec = settings.DEBUG and request.data.get('simuler') == 'echec'

        if echec:
            paiement.statut = 'echoue'
            paiement.save(update_fields=['statut'])
        else:
            paiement.statut = 'paye'
            paiement.save(update_fields=['statut'])
            if commande.statut == 'en_attente':
                commande.statut = 'confirmee'
                commande.save(update_fields=['statut'])

        commande.refresh_from_db()
        return Response(donnees_commande(commande))