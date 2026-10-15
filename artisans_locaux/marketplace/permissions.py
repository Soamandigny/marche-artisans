from rest_framework.permissions import BasePermission, SAFE_METHODS


def _role(request):
    return getattr(request.user, 'role', None)


class EstAdmin(BasePermission):
    def has_permission(self, request, view):
        return _role(request) == 'admin'


class EstArtisan(BasePermission):
    def has_permission(self, request, view):
        return _role(request) in ('artisan', 'admin')


class EstClient(BasePermission):
    def has_permission(self, request, view):
        return _role(request) == 'client'


class LectureSeuleOuAdmin(BasePermission):
    """Tout le monde lit. Seul l'admin modifie."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return _role(request) == 'admin'


class LectureSeuleOuArtisan(BasePermission):
    """
    Tout le monde lit. Les artisans (et admins) peuvent écrire,
    mais un artisan ne modifie que SES produits.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return _role(request) in ('artisan', 'admin')

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if _role(request) == 'admin':
            return True
        return obj.id_artisan.id_utilisateur_id == request.user.pk