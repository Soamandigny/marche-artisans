from django.contrib.auth.hashers import make_password, check_password
from django.core import signing
from django.db import transaction
from rest_framework import authentication, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Utilisateur, Client, Artisan

TOKEN_SALT = 'marketplace-auth'
TOKEN_DUREE = 60 * 60 * 24 * 7  # 7 jours


def creer_token(utilisateur):
    return signing.dumps({'id': utilisateur.id_utilisateur}, salt=TOKEN_SALT)


class TokenAuthentication(authentication.BaseAuthentication):
    """Lit l'en-tête  Authorization: Bearer <token>"""

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return None

        token = header[7:]
        try:
            data = signing.loads(token, salt=TOKEN_SALT, max_age=TOKEN_DUREE)
            utilisateur = Utilisateur.objects.get(pk=data['id'])
        except (signing.BadSignature, Utilisateur.DoesNotExist):
            # Token invalide : on traite la requête comme anonyme.
            # Les routes protégées répondront 401 grâce aux permissions.
            return None

        return (utilisateur, token)

    def authenticate_header(self, request):
        return 'Bearer'


def donnees_utilisateur(u):
    data = {
        'id_utilisateur': u.id_utilisateur,
        'nom': u.nom,
        'prenom': u.prenom,
        'email': u.email,
        'role': u.role,
    }
    if u.role == 'artisan' and hasattr(u, 'artisan'):
        data['id_artisan'] = u.artisan.id_artisan
        data['nom_entreprise'] = u.artisan.nom_entreprise
    if u.role == 'client' and hasattr(u, 'client'):
        data['id_client'] = u.client.id_client
    return data


class InscriptionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        d = request.data

        nom = (d.get('nom') or '').strip()
        prenom = (d.get('prenom') or '').strip()
        email = (d.get('email') or '').strip().lower()
        mot_de_passe = d.get('mot_de_passe') or ''
        role = d.get('role') or 'client'
        nom_entreprise = (d.get('nom_entreprise') or '').strip()

        if not nom or not prenom or not email or not mot_de_passe:
            return Response(
                {'detail': 'Nom, prénom, email et mot de passe sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role not in ('client', 'artisan'):
            return Response(
                {'detail': 'Rôle invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(mot_de_passe) < 8:
            return Response(
                {'detail': 'Le mot de passe doit contenir au moins 8 caractères.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role == 'artisan' and not nom_entreprise:
            return Response(
                {'detail': "Le nom de l'entreprise est obligatoire pour un artisan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Utilisateur.objects.filter(email=email).exists():
            return Response(
                {'detail': 'Un compte existe déjà avec cet email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        utilisateur = Utilisateur.objects.create(
            nom=nom,
            prenom=prenom,
            email=email,
            mot_de_passe=make_password(mot_de_passe),
            role=role,
        )

        if role == 'artisan':
            Artisan.objects.create(
                id_utilisateur=utilisateur,
                nom_entreprise=nom_entreprise,
            )
        else:
            Client.objects.create(id_utilisateur=utilisateur)

        utilisateur.refresh_from_db()

        return Response(
            {
                'token': creer_token(utilisateur),
                'utilisateur': donnees_utilisateur(utilisateur),
            },
            status=status.HTTP_201_CREATED,
        )


class ConnexionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        mot_de_passe = request.data.get('mot_de_passe') or ''

        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            utilisateur = None

        if utilisateur is None or not check_password(mot_de_passe, utilisateur.mot_de_passe):
            return Response(
                {'detail': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({
            'token': creer_token(utilisateur),
            'utilisateur': donnees_utilisateur(utilisateur),
        })


class MoiView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(donnees_utilisateur(request.user))