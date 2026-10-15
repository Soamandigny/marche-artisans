from django.db import models
from django.core.validators import MinValueValidator



# UTILISATEUR

class Utilisateur(models.Model):

    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('artisan', 'Artisan'),
        ('client', 'Client'),
    ]

    id_utilisateur = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    mot_de_passe = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'utilisateur'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    @property
    def is_authenticated(self):
        return True
    


# ARTISAN

class Artisan(models.Model):

    id_artisan = models.AutoField(primary_key=True)
    nom_entreprise = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)

    id_utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='artisan',
        db_column='id_utilisateur'
    )

    class Meta:
        db_table = 'artisan'
        verbose_name = 'Artisan'
        verbose_name_plural = 'Artisans'

    def __str__(self):
        return self.nom_entreprise



# CLIENT

class Client(models.Model):

    id_client = models.AutoField(primary_key=True)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)

    id_utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='client',
        db_column='id_utilisateur'
    )

    class Meta:
        db_table = 'client'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'

    def __str__(self):
        return f"Client #{self.id_client}"



# CATEGORIE

class Categorie(models.Model):

    id_categorie = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'categorie'
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['nom']

    def __str__(self):
        return self.nom



# PRODUIT

class Produit(models.Model):

    id_produit = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)

    prix = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    image = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    id_artisan = models.ForeignKey(
        Artisan,
        on_delete=models.CASCADE,
        related_name='produits',
        db_column='id_artisan'
    )

    id_categorie = models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT,
        related_name='produits',
        db_column='id_categorie'
    )

    class Meta:
        db_table = 'produit'
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        ordering = ['nom']

    def __str__(self):
        return self.nom



# PANIER

class Panier(models.Model):

    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('valide', 'Validé'),
        ('abandonne', 'Abandonné'),
    ]

    id_panier = models.AutoField(primary_key=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default='actif'
    )

    id_client = models.OneToOneField(
        Client,
        on_delete=models.CASCADE,
        related_name='panier',
        db_column='id_client'
    )

    class Meta:
        db_table = 'panier'
        verbose_name = 'Panier'
        verbose_name_plural = 'Paniers'

    def __str__(self):
        return f"Panier #{self.id_panier}"



# LIGNE PANIER

class LignePanier(models.Model):

    id_ligne_panier = models.AutoField(primary_key=True)

    quantite = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    id_panier = models.ForeignKey(
        Panier,
        on_delete=models.CASCADE,
        related_name='lignes',
        db_column='id_panier'
    )

    id_produit = models.ForeignKey(
        Produit,
        on_delete=models.CASCADE,
        related_name='lignes_panier',
        db_column='id_produit'
    )

    class Meta:
        db_table = 'ligne_panier'
        verbose_name = 'Ligne de panier'
        verbose_name_plural = 'Lignes de panier'
        constraints = [
            models.UniqueConstraint(
                fields=['id_panier', 'id_produit'],
                name='unique_produit_panier'
            )
        ]

    def __str__(self):
        return f"{self.id_produit} x {self.quantite}"



# COMMANDE

class Commande(models.Model):

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('preparee', 'Préparée'),
        ('expediee', 'Expédiée'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]

    id_commande = models.AutoField(primary_key=True)
    date_commande = models.DateTimeField(auto_now_add=True)

    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default='en_attente'
    )

    adresse_livraison = models.CharField(max_length=255)

    id_client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='commandes',
        db_column='id_client'
    )

    class Meta:
        db_table = 'commande'
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-date_commande']

    def __str__(self):
        return f"Commande #{self.id_commande}"



# LIGNE COMMANDE

class LigneCommande(models.Model):

    id_ligne_commande = models.AutoField(primary_key=True)

    quantite = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    id_commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='lignes',
        db_column='id_commande'
    )

    id_produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        related_name='lignes_commandes',
        db_column='id_produit'
    )

    class Meta:
        db_table = 'ligne_commande'
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'

    def __str__(self):
        return f"{self.id_produit} x {self.quantite}"



# PAIEMENT

class Paiement(models.Model):

    MODE_CHOICES = [
        ('especes', 'Espèces'),
        ('mobile_money', 'Mobile Money'),
        ('carte', 'Carte bancaire'),
        ('virement', 'Virement'),
    ]

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('paye', 'Payé'),
        ('echoue', 'Échoué'),
        ('rembourse', 'Remboursé'),
    ]

    id_paiement = models.AutoField(primary_key=True)
    date_paiement = models.DateTimeField(auto_now_add=True)

    montant = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    mode_paiement = models.CharField(
        max_length=50,
        choices=MODE_CHOICES
    )

    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default='en_attente'
    )

    id_commande = models.OneToOneField(
        Commande,
        on_delete=models.CASCADE,
        related_name='paiement',
        db_column='id_commande'
    )

    class Meta:
        db_table = 'paiement'
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'

    def __str__(self):
        return f"Paiement #{self.id_paiement}"



# LIVRAISON

class Livraison(models.Model):

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('preparee', 'Préparée'),
        ('expediee', 'Expédiée'),
        ('livree', 'Livrée'),
    ]

    id_livraison = models.AutoField(primary_key=True)
    adresse = models.CharField(max_length=255)

    date_expedition = models.DateTimeField(
        blank=True,
        null=True
    )

    date_livraison = models.DateTimeField(
        blank=True,
        null=True
    )

    statut = models.CharField(
        max_length=30,
        choices=STATUT_CHOICES,
        default='en_attente'
    )

    id_commande = models.OneToOneField(
        Commande,
        on_delete=models.CASCADE,
        related_name='livraison',
        db_column='id_commande'
    )

    class Meta:
        db_table = 'livraison'
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'

    def __str__(self):
        return f"Livraison #{self.id_livraison}"