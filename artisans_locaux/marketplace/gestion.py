from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db.models import Count, ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import TokenAuthentication
from .commandes import erreur
from .models import Artisan, Client, Utilisateur
from .permissions import EstAdmin


def donnees_utilisateur_admin(u):
    artisan = getattr(u, 'artisan', None)
    return {
        'id_utilisateur': u.id_utilisateur,
        'nom': u.nom,
        'prenom': u.prenom,
        'email': u.email,
        'role': u.role,
        'role_label': u.get_role_display(),
        'date_creation': u.date_creation,
        'nom_entreprise': artisan.nom_entreprise if artisan else None,
        'nombre_produits': artisan.produits.count() if artisan else None,
    }


class BaseAdminView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [EstAdmin]


class UtilisateursAdminView(BaseAdminView):
    """GET /api/gestion/utilisateurs/   |   POST (création d'un compte)"""

    def get(self, request):
        utilisateurs = (
            Utilisateur.objects
            .select_related('artisan')
            .order_by('-date_creation')
        )
        return Response([donnees_utilisateur_admin(u) for u in utilisateurs])

    @transaction.atomic
    def post(self, request):
        d = request.data

        nom = (d.get('nom') or '').strip()
        prenom = (d.get('prenom') or '').strip()
        email = (d.get('email') or '').strip().lower()
        mot_de_passe = d.get('mot_de_passe') or ''
        role = d.get('role') or ''
        nom_entreprise = (d.get('nom_entreprise') or '').strip()

        if not nom or not prenom or not email or not mot_de_passe:
            return erreur(
                'Nom, prénom, email et mot de passe sont obligatoires.'
            )
        if role not in ('client', 'artisan', 'admin'):
            return erreur('Rôle invalide.')
        if len(mot_de_passe) < 8:
            return erreur(
                'Le mot de passe doit contenir au moins 8 caractères.'
            )
        if role == 'artisan' and not nom_entreprise:
            return erreur("Le nom de l'entreprise est obligatoire.")
        if Utilisateur.objects.filter(email=email).exists():
            return erreur('Un compte existe déjà avec cet email.')

        u = Utilisateur.objects.create(
            nom=nom,
            prenom=prenom,
            email=email,
            mot_de_passe=make_password(mot_de_passe),
            role=role,
        )

        if role == 'artisan':
            Artisan.objects.create(id_utilisateur=u, nom_entreprise=nom_entreprise)
        elif role == 'client':
            Client.objects.create(id_utilisateur=u)

        u = Utilisateur.objects.select_related('artisan').get(pk=u.pk)
        return Response(
            donnees_utilisateur_admin(u), status=status.HTTP_201_CREATED
        )


class UtilisateurAdminDetailView(BaseAdminView):
    """DELETE /api/gestion/utilisateurs/<id>/"""

    def delete(self, request, id_utilisateur):
        u = Utilisateur.objects.filter(pk=id_utilisateur).first()
        if u is None:
            return erreur('Utilisateur introuvable.', status.HTTP_404_NOT_FOUND)

        if u.pk == request.user.pk:
            return erreur('Vous ne pouvez pas supprimer votre propre compte.')

        if (
            u.role == 'admin'
            and Utilisateur.objects.filter(role='admin').count() <= 1
        ):
            return erreur('Impossible de supprimer le dernier administrateur.')

        try:
            with transaction.atomic():
                u.delete()
        except ProtectedError:
            return erreur(
                "Ce compte est lié à des commandes : il ne peut pas être "
                "supprimé, pour conserver l'historique."
            )

        return Response(status=status.HTTP_204_NO_CONTENT)