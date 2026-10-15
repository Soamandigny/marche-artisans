from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .auth import InscriptionView, ConnexionView, MoiView
from .panier import PanierView, PanierAjouterView, PanierLigneView
from .commandes import CommanderView, MesCommandesView, MaCommandeView
from .paiements import PayerView
from .artisan import TableauDeBordView
from .commandes_artisan import CommandesRecuesView, ChangerStatutView
from .gestion import UtilisateursAdminView, UtilisateurAdminDetailView
from .gestion_stats import StatistiquesView, ToutesCommandesView

from .views import (
    UtilisateurViewSet,
    ArtisanViewSet,
    ClientViewSet,
    CategorieViewSet,
    ProduitViewSet,
    PanierViewSet,
    LignePanierViewSet,
    CommandeViewSet,
    LigneCommandeViewSet,
    PaiementViewSet,
    LivraisonViewSet,
)


router = DefaultRouter()

router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'artisans', ArtisanViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'categories', CategorieViewSet)
router.register(r'produits', ProduitViewSet)
router.register(r'paniers', PanierViewSet)
router.register(r'lignes-panier', LignePanierViewSet)
router.register(r'commandes', CommandeViewSet)
router.register(r'lignes-commande', LigneCommandeViewSet)
router.register(r'paiements', PaiementViewSet)
router.register(r'livraisons', LivraisonViewSet)


urlpatterns = [
    path('auth/inscription/', InscriptionView.as_view()),
    path('auth/connexion/', ConnexionView.as_view()),
    path('auth/moi/', MoiView.as_view()),

    path('panier/', PanierView.as_view()),
    path('panier/ajouter/', PanierAjouterView.as_view()),
    path('panier/lignes/<int:id_ligne>/', PanierLigneView.as_view()),

    path('commander/', CommanderView.as_view()),
    path('mes-commandes/', MesCommandesView.as_view()),
    path('mes-commandes/<int:id_commande>/', MaCommandeView.as_view()),
    path('mes-commandes/<int:id_commande>/payer/', PayerView.as_view()),

    path('artisan/tableau-de-bord/', TableauDeBordView.as_view()),
    path('artisan/commandes/', CommandesRecuesView.as_view()),
    path('artisan/commandes/<int:id_commande>/statut/', ChangerStatutView.as_view()),

    path('gestion/utilisateurs/', UtilisateursAdminView.as_view()),
    path('gestion/utilisateurs/<int:id_utilisateur>/', UtilisateurAdminDetailView.as_view()),
    path('gestion/statistiques/', StatistiquesView.as_view()),
    path('gestion/commandes/', ToutesCommandesView.as_view()),

    path('', include(router.urls)),
]