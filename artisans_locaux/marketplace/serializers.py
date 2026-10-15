from rest_framework import serializers

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

class UtilisateurSerializer(serializers.ModelSerializer):

    class Meta:
        model = Utilisateur
        fields = [
            'id_utilisateur',
            'nom',
            'prenom',
            'email',
            'role',
            'date_creation',
        ]



# ARTISAN

class ArtisanSerializer(serializers.ModelSerializer):

    class Meta:
        model = Artisan
        fields = [
            'id_artisan',
            'nom_entreprise',
            'description',
            'telephone',
            'adresse',
            'id_utilisateur',
        ]



# CLIENT

class ClientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = [
            'id_client',
            'telephone',
            'adresse',
            'id_utilisateur',
        ]



# CATEGORIE

class CategorieSerializer(serializers.ModelSerializer):

    class Meta:
        model = Categorie
        fields = [
            'id_categorie',
            'nom',
            'description',
        ]



# PRODUIT

# PRODUIT

class ProduitSerializer(serializers.ModelSerializer):

    artisan_nom = serializers.CharField(
        source='id_artisan.nom_entreprise',
        read_only=True
    )

    categorie_nom = serializers.CharField(
        source='id_categorie.nom',
        read_only=True
    )

    class Meta:
        model = Produit
        fields = [
            'id_produit',
            'nom',
            'description',
            'prix',
            'stock',
            'image',
            'date_creation',
            'id_artisan',
            'artisan_nom',
            'id_categorie',
            'categorie_nom',
        ]
        read_only_fields = ['id_artisan']
# PANIER

class PanierSerializer(serializers.ModelSerializer):

    class Meta:
        model = Panier
        fields = [
            'id_panier',
            'date_creation',
            'statut',
            'id_client',
        ]



# LIGNE PANIER

class LignePanierSerializer(serializers.ModelSerializer):

    class Meta:
        model = LignePanier
        fields = [
            'id_ligne_panier',
            'quantite',
            'id_panier',
            'id_produit',
        ]



# COMMANDE

class CommandeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Commande
        fields = [
            'id_commande',
            'date_commande',
            'montant_total',
            'statut',
            'adresse_livraison',
            'id_client',
        ]



# LIGNE COMMANDE

class LigneCommandeSerializer(serializers.ModelSerializer):

    class Meta:
        model = LigneCommande
        fields = [
            'id_ligne_commande',
            'quantite',
            'prix_unitaire',
            'id_commande',
            'id_produit',
        ]



# PAIEMENT

class PaiementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Paiement
        fields = [
            'id_paiement',
            'date_paiement',
            'montant',
            'mode_paiement',
            'statut',
            'id_commande',
        ]



# LIVRAISON

class LivraisonSerializer(serializers.ModelSerializer):

    class Meta:
        model = Livraison
        fields = [
            'id_livraison',
            'adresse',
            'date_expedition',
            'date_livraison',
            'statut',
            'id_commande',
        ]