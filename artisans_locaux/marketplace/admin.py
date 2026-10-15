from django.contrib.auth.hashers import make_password, identify_hasher
from django.contrib import admin

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



# UTILISATEUR

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):

    list_display = (
        'id_utilisateur',
        'nom',
        'prenom',
        'email',
        'role',
        'date_creation',
    )

    list_filter = ('role', 'date_creation')

    search_fields = (
        'nom',
        'prenom',
        'email',
    )

    ordering = ('id_utilisateur',)

    def save_model(self, request, obj, form, change):
        try:
            identify_hasher(obj.mot_de_passe)   # déjà haché : on ne touche pas
        except ValueError:
            obj.mot_de_passe = make_password(obj.mot_de_passe)
        super().save_model(request, obj, form, change)


# ARTISAN

@admin.register(Artisan)
class ArtisanAdmin(admin.ModelAdmin):
    list_display = (
        'id_artisan',
        'nom_entreprise',
        'telephone',
        'adresse',
        'id_utilisateur',
    )

    search_fields = (
        'nom_entreprise',
        'telephone',
        'adresse',
    )

    ordering = ('id_artisan',)



# CLIENT

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):

    list_display = (
        'id_client',
        'id_utilisateur',
        'telephone',
        'adresse',
    )

    search_fields = (
        'telephone',
        'adresse',
        'id_utilisateur__nom',
        'id_utilisateur__prenom',
        'id_utilisateur__email',
    )

    ordering = ('id_client',)



# CATEGORIE

@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):

    list_display = (
        'id_categorie',
        'nom',
        'description',
    )

    search_fields = (
        'nom',
        'description',
    )

    ordering = ('nom',)



# PRODUIT

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):

    list_display = (
        'id_produit',
        'nom',
        'prix',
        'stock',
        'id_artisan',
        'id_categorie',
        'date_creation',
    )

    list_filter = (
        'id_categorie',
        'id_artisan',
        'date_creation',
    )

    search_fields = (
        'nom',
        'description',
    )

    ordering = ('id_produit',)



# PANIER

@admin.register(Panier)
class PanierAdmin(admin.ModelAdmin):

    list_display = (
        'id_panier',
        'id_client',
        'statut',
        'date_creation',
    )

    list_filter = (
        'statut',
        'date_creation',
    )

    ordering = ('id_panier',)



# LIGNE PANIER

@admin.register(LignePanier)
class LignePanierAdmin(admin.ModelAdmin):

    list_display = (
        'id_ligne_panier',
        'id_panier',
        'id_produit',
        'quantite',
    )

    search_fields = (
        'id_produit__nom',
    )

    ordering = ('id_ligne_panier',)



# COMMANDE

@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):

    list_display = (
        'id_commande',
        'id_client',
        'date_commande',
        'montant_total',
        'statut',
        'adresse_livraison',
    )

    list_filter = (
        'statut',
        'date_commande',
    )

    search_fields = (
        'adresse_livraison',
        'id_client__id_utilisateur__nom',
        'id_client__id_utilisateur__prenom',
        'id_client__id_utilisateur__email',
    )

    ordering = ('-date_commande',)



# LIGNE COMMANDE

@admin.register(LigneCommande)
class LigneCommandeAdmin(admin.ModelAdmin):

    list_display = (
        'id_ligne_commande',
        'id_commande',
        'id_produit',
        'quantite',
        'prix_unitaire',
    )

    search_fields = (
        'id_produit__nom',
    )

    ordering = ('id_ligne_commande',)



# PAIEMENT

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):

    list_display = (
        'id_paiement',
        'id_commande',
        'date_paiement',
        'montant',
        'mode_paiement',
        'statut',
    )

    list_filter = (
        'mode_paiement',
        'statut',
        'date_paiement',
    )

    ordering = ('-date_paiement',)



# LIVRAISON

@admin.register(Livraison)
class LivraisonAdmin(admin.ModelAdmin):

    list_display = (
        'id_livraison',
        'id_commande',
        'adresse',
        'date_expedition',
        'date_livraison',
        'statut',
    )

    list_filter = (
        'statut',
        'date_expedition',
        'date_livraison',
    )

    search_fields = (
        'adresse',
    )

    ordering = ('id_livraison',)