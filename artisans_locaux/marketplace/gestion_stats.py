from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from rest_framework.response import Response

from .commandes_artisan import donnees_artisan
from .gestion import BaseAdminView
from .models import Commande, LigneCommande, Paiement, Produit, Utilisateur

MONTANT = ExpressionWrapper(
    F('quantite') * F('prix_unitaire'),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)


class StatistiquesView(BaseAdminView):
    """GET /api/gestion/statistiques/"""

    def get(self, request):
        # Les commandes annulées ne comptent pas dans les ventes
        lignes = LigneCommande.objects.exclude(id_commande__statut='annulee')

        par_statut = {
            r['statut']: r['n']
            for r in Commande.objects.order_by()
            .values('statut').annotate(n=Count('pk'))
        }
        statuts = [
            {'code': code, 'label': label, 'nombre': par_statut.get(code, 0)}
            for code, label in Commande.STATUT_CHOICES
        ]

        par_role = {
            r['role']: r['n']
            for r in Utilisateur.objects.order_by()
            .values('role').annotate(n=Count('pk'))
        }

        top_produits = [
            {
                'id_produit': r['id_produit'],
                'nom': r['id_produit__nom'],
                'image': r['id_produit__image'],
                'vendus': r['vendus'],
                'total': str(r['total']),
            }
            for r in lignes.order_by()
            .values('id_produit', 'id_produit__nom', 'id_produit__image')
            .annotate(vendus=Sum('quantite'), total=Sum(MONTANT))
            .order_by('-vendus')[:5]
        ]

        top_artisans = [
            {
                'id_artisan': r['id_produit__id_artisan'],
                'nom': r['id_produit__id_artisan__nom_entreprise'],
                'vendus': r['vendus'],
                'total': str(r['total']),
            }
            for r in lignes.order_by()
            .values(
                'id_produit__id_artisan',
                'id_produit__id_artisan__nom_entreprise',
            )
            .annotate(vendus=Sum('quantite'), total=Sum(MONTANT))
            .order_by('-total')[:5]
        ]

        return Response({
            'chiffre_affaires': str(lignes.aggregate(t=Sum(MONTANT))['t'] or 0),
            'encaisse': str(
                Paiement.objects.filter(statut='paye')
                .aggregate(t=Sum('montant'))['t'] or 0
            ),
            'articles_vendus': lignes.aggregate(q=Sum('quantite'))['q'] or 0,
            'nombre_commandes': Commande.objects.count(),
            'statuts': statuts,
            'utilisateurs': {
                'client': par_role.get('client', 0),
                'artisan': par_role.get('artisan', 0),
                'admin': par_role.get('admin', 0),
            },
            'nombre_produits': Produit.objects.count(),
            'ruptures': Produit.objects.filter(stock=0).count(),
            'top_produits': top_produits,
            'top_artisans': top_artisans,
        })


class ToutesCommandesView(BaseAdminView):
    """GET /api/gestion/commandes/"""

    def get(self, request):
        commandes = Commande.objects.select_related(
            'id_client__id_utilisateur', 'paiement', 'livraison'
        )

        resultat = []
        for c in commandes:
            data = donnees_artisan(c, None)  # None = toutes les lignes
            data['artisans'] = sorted({
                l.id_produit.id_artisan.nom_entreprise
                for l in c.lignes.select_related('id_produit__id_artisan')
            })
            resultat.append(data)

        return Response(resultat)