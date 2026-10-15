from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .auth import creer_token
from .models import (
    Artisan,
    Categorie,
    Client,
    Commande,
    LignePanier,
    Livraison,
    Paiement,
    Produit,
    Utilisateur,
)


def creer_compte(email, role, **extra):
    """Crée un utilisateur avec son profil, comme l'inscription."""
    u = Utilisateur.objects.create(
        nom='Nom', prenom='Prenom', email=email,
        mot_de_passe='x', role=role,
    )
    if role == 'artisan':
        Artisan.objects.create(
            id_utilisateur=u,
            nom_entreprise=extra.get('entreprise', 'Atelier'),
        )
    elif role == 'client':
        Client.objects.create(id_utilisateur=u)
    return u


def api_pour(utilisateur=None):
    c = APIClient()
    if utilisateur is not None:
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {creer_token(utilisateur)}')
    return c


class BaseTest(TestCase):

    def setUp(self):
        self.categorie = Categorie.objects.create(nom='Bijoux')

        self.u_artisan = creer_compte('a@t.com', 'artisan', entreprise='Atelier A')
        self.u_artisan2 = creer_compte('b@t.com', 'artisan', entreprise='Atelier B')
        self.u_client = creer_compte('c@t.com', 'client')
        self.u_client2 = creer_compte('d@t.com', 'client')
        self.u_admin = creer_compte('z@t.com', 'admin')

        self.produit = Produit.objects.create(
            nom='Bracelet', prix=Decimal('1000'), stock=5,
            id_artisan=self.u_artisan.artisan, id_categorie=self.categorie,
        )
        self.produit_b = Produit.objects.create(
            nom='Collier', prix=Decimal('2000'), stock=5,
            id_artisan=self.u_artisan2.artisan, id_categorie=self.categorie,
        )

    def commander(self, utilisateur, produit, quantite, mode='especes'):
        c = api_pour(utilisateur)
        c.post('/api/panier/ajouter/', {
            'id_produit': produit.pk, 'quantite': quantite,
        }, format='json')
        return c.post('/api/commander/', {
            'adresse_livraison': '12 rue des Fleurs',
            'mode_paiement': mode,
        }, format='json')


class AuthTests(BaseTest):

    def donnees(self, **extra):
        d = {
            'nom': 'Dupont', 'prenom': 'Jean', 'email': 'jean@t.com',
            'mot_de_passe': 'motdepasse123', 'role': 'client',
        }
        d.update(extra)
        return d

    def test_inscription_hache_le_mot_de_passe(self):
        r = APIClient().post('/api/auth/inscription/', self.donnees(), format='json')
        self.assertEqual(r.status_code, 201)
        u = Utilisateur.objects.get(email='jean@t.com')
        self.assertNotEqual(u.mot_de_passe, 'motdepasse123')
        self.assertTrue(u.mot_de_passe.startswith('pbkdf2_'))
        self.assertTrue(Client.objects.filter(id_utilisateur=u).exists())

    def test_inscription_admin_interdite(self):
        r = APIClient().post(
            '/api/auth/inscription/', self.donnees(role='admin'), format='json'
        )
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Utilisateur.objects.filter(email='jean@t.com').exists())

    def test_mot_de_passe_trop_court(self):
        r = APIClient().post(
            '/api/auth/inscription/', self.donnees(mot_de_passe='abc'), format='json'
        )
        self.assertEqual(r.status_code, 400)

    def test_connexion(self):
        c = APIClient()
        c.post('/api/auth/inscription/', self.donnees(), format='json')
        ok = c.post('/api/auth/connexion/', {
            'email': 'jean@t.com', 'mot_de_passe': 'motdepasse123',
        }, format='json')
        self.assertEqual(ok.status_code, 200)
        self.assertIn('token', ok.data)

        mauvais = c.post('/api/auth/connexion/', {
            'email': 'jean@t.com', 'mot_de_passe': 'faux',
        }, format='json')
        self.assertEqual(mauvais.status_code, 401)

    def test_faux_token_traite_comme_anonyme(self):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION='Bearer abc')
        self.assertEqual(c.get('/api/produits/').status_code, 200)
        self.assertEqual(c.get('/api/auth/moi/').status_code, 401)


class PermissionTests(BaseTest):

    def test_routes_sensibles_fermees_sans_token(self):
        for url in ('/api/commandes/', '/api/utilisateurs/', '/api/paiements/'):
            self.assertIn(APIClient().get(url).status_code, (401, 403))

    def test_lecture_produits_publique(self):
        self.assertEqual(APIClient().get('/api/produits/').status_code, 200)

    def test_client_ne_cree_pas_de_produit(self):
        r = api_pour(self.u_client).post('/api/produits/', {
            'nom': 'X', 'prix': '10', 'stock': 1,
            'id_categorie': self.categorie.pk,
        }, format='json')
        self.assertEqual(r.status_code, 403)

    def test_artisan_cree_son_produit_avec_son_id(self):
        r = api_pour(self.u_artisan).post('/api/produits/', {
            'nom': 'Neuf', 'prix': '10', 'stock': 1,
            'id_categorie': self.categorie.pk,
            'id_artisan': self.u_artisan2.artisan.pk,  # tentative de triche
        }, format='json')
        self.assertEqual(r.status_code, 201)
        p = Produit.objects.get(nom='Neuf')
        self.assertEqual(p.id_artisan, self.u_artisan.artisan)

    def test_artisan_ne_modifie_pas_le_produit_dun_autre(self):
        r = api_pour(self.u_artisan).patch(
            f'/api/produits/{self.produit_b.pk}/', {'prix': '1'}, format='json'
        )
        self.assertEqual(r.status_code, 403)
        self.produit_b.refresh_from_db()
        self.assertEqual(self.produit_b.prix, Decimal('2000'))

    def test_artisan_modifie_son_produit(self):
        r = api_pour(self.u_artisan).patch(
            f'/api/produits/{self.produit.pk}/', {'stock': 9}, format='json'
        )
        self.assertEqual(r.status_code, 200)

    def test_prix_negatif_refuse(self):
        r = api_pour(self.u_artisan).patch(
            f'/api/produits/{self.produit.pk}/', {'prix': '-5'}, format='json'
        )
        self.assertEqual(r.status_code, 400)

    def test_espaces_reserves(self):
        self.assertEqual(
            api_pour(self.u_client).get('/api/artisan/tableau-de-bord/').status_code, 403
        )
        self.assertEqual(
            api_pour(self.u_artisan).get('/api/gestion/statistiques/').status_code, 403
        )
        self.assertEqual(
            api_pour(self.u_admin).get('/api/gestion/statistiques/').status_code, 200
        )


class PanierTests(BaseTest):

    def test_ajout_et_limite_de_stock(self):
        c = api_pour(self.u_client)
        ok = c.post('/api/panier/ajouter/', {
            'id_produit': self.produit.pk, 'quantite': 5}, format='json')
        self.assertEqual(ok.status_code, 201)

        trop = c.post('/api/panier/ajouter/', {
            'id_produit': self.produit.pk, 'quantite': 1}, format='json')
        self.assertEqual(trop.status_code, 400)

    def test_artisan_na_pas_de_panier(self):
        r = api_pour(self.u_artisan).post('/api/panier/ajouter/', {
            'id_produit': self.produit.pk, 'quantite': 1}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_ligne_dun_autre_client_inaccessible(self):
        c1 = api_pour(self.u_client)
        c1.post('/api/panier/ajouter/', {
            'id_produit': self.produit.pk, 'quantite': 1}, format='json')
        ligne = LignePanier.objects.get()

        r = api_pour(self.u_client2).delete(f'/api/panier/lignes/{ligne.pk}/')
        self.assertEqual(r.status_code, 404)
        self.assertTrue(LignePanier.objects.filter(pk=ligne.pk).exists())


class CommandeTests(BaseTest):

    def test_commande_calcule_le_total_et_met_a_jour_le_stock(self):
        r = self.commander(self.u_client, self.produit, 3)
        self.assertEqual(r.status_code, 201)

        commande = Commande.objects.get()
        self.assertEqual(commande.montant_total, Decimal('3000'))
        self.assertEqual(commande.lignes.get().prix_unitaire, Decimal('1000'))

        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock, 2)

        self.assertEqual(LignePanier.objects.count(), 0)
        self.assertTrue(Paiement.objects.filter(id_commande=commande).exists())
        self.assertTrue(Livraison.objects.filter(id_commande=commande).exists())

    def test_commande_refusee_si_stock_insuffisant(self):
        c = api_pour(self.u_client)
        c.post('/api/panier/ajouter/', {
            'id_produit': self.produit.pk, 'quantite': 3}, format='json')

        # Le stock baisse entre l'ajout au panier et la validation
        Produit.objects.filter(pk=self.produit.pk).update(stock=1)

        r = c.post('/api/commander/', {
            'adresse_livraison': '12 rue des Fleurs',
            'mode_paiement': 'especes'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Commande.objects.count(), 0)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock, 1)

    def test_commande_refusee_avec_panier_vide_ou_adresse_courte(self):
        c = api_pour(self.u_client)
        self.assertEqual(c.post('/api/commander/', {
            'adresse_livraison': '12 rue des Fleurs',
            'mode_paiement': 'especes'}, format='json').status_code, 400)

        c.post('/api/panier/ajouter/', {
            'id_produit': self.produit.pk, 'quantite': 1}, format='json')
        self.assertEqual(c.post('/api/commander/', {
            'adresse_livraison': 'ab',
            'mode_paiement': 'especes'}, format='json').status_code, 400)

    def test_client_ne_voit_que_ses_commandes(self):
        self.commander(self.u_client, self.produit, 1)
        commande = Commande.objects.get()

        autre = api_pour(self.u_client2)
        self.assertEqual(autre.get('/api/mes-commandes/').data, [])
        self.assertEqual(
            autre.get(f'/api/mes-commandes/{commande.pk}/').status_code, 404
        )


@override_settings(DEBUG=True)
class PaiementTests(BaseTest):

    def creer_commande_mobile(self):
        self.commander(self.u_client, self.produit, 1, mode='mobile_money')
        return Commande.objects.get()

    def test_paiement_reussi_confirme_la_commande(self):
        commande = self.creer_commande_mobile()
        r = api_pour(self.u_client).post(
            f'/api/mes-commandes/{commande.pk}/payer/',
            {'numero': '0341234567'}, format='json')
        self.assertEqual(r.status_code, 200)
        commande.refresh_from_db()
        self.assertEqual(commande.statut, 'confirmee')
        self.assertEqual(commande.paiement.statut, 'paye')

    def test_double_paiement_refuse(self):
        commande = self.creer_commande_mobile()
        c = api_pour(self.u_client)
        url = f'/api/mes-commandes/{commande.pk}/payer/'
        c.post(url, {'numero': '0341234567'}, format='json')
        self.assertEqual(c.post(url, {'numero': '0341234567'}, format='json').status_code, 400)

    def test_numero_invalide_refuse(self):
        commande = self.creer_commande_mobile()
        r = api_pour(self.u_client).post(
            f'/api/mes-commandes/{commande.pk}/payer/',
            {'numero': '123'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_echec_simule_ne_confirme_pas(self):
        commande = self.creer_commande_mobile()
        api_pour(self.u_client).post(
            f'/api/mes-commandes/{commande.pk}/payer/',
            {'numero': '0341234567', 'simuler': 'echec'}, format='json')
        commande.refresh_from_db()
        self.assertEqual(commande.statut, 'en_attente')
        self.assertEqual(commande.paiement.statut, 'echoue')

    def test_payer_la_commande_dun_autre_est_impossible(self):
        commande = self.creer_commande_mobile()
        r = api_pour(self.u_client2).post(
            f'/api/mes-commandes/{commande.pk}/payer/',
            {'numero': '0341234567'}, format='json')
        self.assertEqual(r.status_code, 404)

    @override_settings(DEBUG=False)
    def test_echec_simule_ignore_en_production(self):
        commande = self.creer_commande_mobile()
        api_pour(self.u_client).post(
            f'/api/mes-commandes/{commande.pk}/payer/',
            {'numero': '0341234567', 'simuler': 'echec'}, format='json')
        commande.refresh_from_db()
        self.assertEqual(commande.paiement.statut, 'paye')


class StatutTests(BaseTest):

    def statut(self, utilisateur, commande, nouveau):
        return api_pour(utilisateur).post(
            f'/api/artisan/commandes/{commande.pk}/statut/',
            {'statut': nouveau}, format='json')

    def test_parcours_complet_en_especes(self):
        self.commander(self.u_client, self.produit, 1)
        commande = Commande.objects.get()

        for etape in ('confirmee', 'preparee', 'expediee', 'livree'):
            self.assertEqual(self.statut(self.u_artisan, commande, etape).status_code, 200)

        commande.refresh_from_db()
        self.assertEqual(commande.statut, 'livree')
        self.assertEqual(commande.livraison.statut, 'livree')
        self.assertIsNotNone(commande.livraison.date_livraison)
        self.assertEqual(commande.paiement.statut, 'paye')  # espèces encaissées

    def test_saut_detape_refuse(self):
        self.commander(self.u_client, self.produit, 1)
        commande = Commande.objects.get()
        self.assertEqual(self.statut(self.u_artisan, commande, 'livree').status_code, 400)

    def test_confirmation_refusee_si_paiement_en_ligne_non_regle(self):
        self.commander(self.u_client, self.produit, 1, mode='mobile_money')
        commande = Commande.objects.get()
        self.assertEqual(self.statut(self.u_artisan, commande, 'confirmee').status_code, 400)

    def test_annulation_remet_le_stock(self):
        self.commander(self.u_client, self.produit, 2)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock, 3)

        commande = Commande.objects.get()
        self.assertEqual(self.statut(self.u_artisan, commande, 'annulee').status_code, 200)
        self.produit.refresh_from_db()
        self.assertEqual(self.produit.stock, 5)

    def test_annulation_rembourse_un_paiement_regle(self):
        self.commander(self.u_client, self.produit, 1, mode='mobile_money')
        commande = Commande.objects.get()
        Paiement.objects.filter(id_commande=commande).update(statut='paye')
        self.statut(self.u_admin, commande, 'annulee')
        commande.paiement.refresh_from_db()
        self.assertEqual(commande.paiement.statut, 'rembourse')

    def test_artisan_etranger_ne_voit_pas_la_commande(self):
        self.commander(self.u_client, self.produit, 1)
        commande = Commande.objects.get()
        self.assertEqual(self.statut(self.u_artisan2, commande, 'confirmee').status_code, 404)

    def test_commande_multi_artisans_reservee_a_ladmin(self):
        c = api_pour(self.u_client)
        c.post('/api/panier/ajouter/', {'id_produit': self.produit.pk, 'quantite': 1}, format='json')
        c.post('/api/panier/ajouter/', {'id_produit': self.produit_b.pk, 'quantite': 1}, format='json')
        c.post('/api/commander/', {
            'adresse_livraison': '12 rue des Fleurs',
            'mode_paiement': 'especes'}, format='json')
        commande = Commande.objects.get()

        self.assertEqual(self.statut(self.u_artisan, commande, 'confirmee').status_code, 403)
        self.assertEqual(self.statut(self.u_admin, commande, 'confirmee').status_code, 200)

    def test_produit_commande_ne_peut_pas_etre_supprime(self):
        self.commander(self.u_client, self.produit, 1)
        r = api_pour(self.u_artisan).delete(f'/api/produits/{self.produit.pk}/')
        self.assertEqual(r.status_code, 400)
        self.assertTrue(Produit.objects.filter(pk=self.produit.pk).exists())