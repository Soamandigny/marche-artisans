from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import TokenAuthentication
from .models import Commande, LigneCommande, Produit
from .permissions import EstArtisan

MONTANT = ExpressionWrapper(
    F('quantite') * F('prix_unitaire'),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)

VALEUR_STOCK = ExpressionWrapper(
    F('stock') * F('prix'),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)

SEUIL_STOCK_FAIBLE = 5


class TableauDeBordView(APIView):
    """GET /api/artisan/tableau-de-bord/"""

    authentication_classes = [TokenAuthentication]
    permission_classes = [EstArtisan]

    def get(self, request):
        user = request.user
        artisan = getattr(user, 'artisan', None)

        produits = Produit.objects.all()
        lignes = LigneCommande.objects.exclude(id_commande__statut='annulee')

        # Un artisan ne voit que ses données (un admin voit tout)
        if artisan is not None:
            produits = produits.filter(id_artisan=artisan)
            lignes = lignes.filter(id_produit__id_artisan=artisan)

        ids_commandes = lignes.values('id_commande')

        stats = {
            'nombre_produits': produits.count(),
            'stock_total': produits.aggregate(s=Sum('stock'))['s'] or 0,
            'valeur_stock': str(
                produits.aggregate(v=Sum(VALEUR_STOCK))['v'] or 0
            ),
            'ruptures': produits.filter(stock=0).count(),
            'stock_faible': produits.filter(
                stock__gt=0, stock__lte=SEUIL_STOCK_FAIBLE
            ).count(),
            'nombre_commandes': Commande.objects.filter(
                pk__in=ids_commandes
            ).count(),
            'commandes_en_attente': Commande.objects.filter(
                pk__in=ids_commandes, statut='en_attente'
            ).count(),
            'articles_vendus': lignes.aggregate(q=Sum('quantite'))['q'] or 0,
            'chiffre_affaires': str(
                lignes.aggregate(t=Sum(MONTANT))['t'] or 0
            ),
        }

        # Produits au stock le plus bas
        a_surveiller = [
            {
                'id_produit': p.id_produit,
                'nom': p.nom,
                'image': p.image,
                'stock': p.stock,
                'prix': str(p.prix),
            }
            for p in produits.order_by('stock', 'nom')[:5]
        ]

        # Dernières commandes (montant = part de cet artisan)
        dernieres = []
        for c in Commande.objects.filter(pk__in=ids_commandes).order_by(
            '-date_commande'
        )[:5]:
            part = lignes.filter(id_commande=c).aggregate(t=Sum(MONTANT))['t']
            dernieres.append({
                'id_commande': c.id_commande,
                'date_commande': c.date_commande,
                'statut': c.statut,
                'statut_label': c.get_statut_display(),
                'montant': str(part or 0),
            })

        return Response({
            'portee': 'artisan' if artisan is not None else 'global',
            'nom_entreprise': artisan.nom_entreprise if artisan else None,
            'stats': stats,
            'a_surveiller': a_surveiller,
            'dernieres_commandes': dernieres,
        })