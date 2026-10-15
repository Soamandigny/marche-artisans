import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePanier } from '../context/PanierContext'

function Navbar() {

  const { utilisateur, chargement, seDeconnecter } = useAuth()
  const { panier } = usePanier()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOuvert, setMenuOuvert] = useState(false)

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => {
    setMenuOuvert(false)
  }, [location.pathname])

  const deconnexion = () => {
    seDeconnecter()
    navigate('/')
  }

  const liensUtilisateur = (
    <>
      {!chargement && !utilisateur && (
        <Link to="/connexion" className="connexion-link">
          Se connecter
        </Link>
      )}

      {!chargement && utilisateur && (
        <>
          {utilisateur.role === 'admin' && (
            <Link to="/admin" className="connexion-link">
              Administration
            </Link>
          )}

          {utilisateur.role === 'artisan' && (
            <Link to="/dashboard" className="connexion-link">
              Mon espace
            </Link>
          )}

          {utilisateur.role === 'client' && (
            <Link to="/mes-commandes" className="connexion-link">
              Mes commandes
            </Link>
          )}

          <Link to="/connexion" className="connexion-link">
            👤 {utilisateur.prenom}
          </Link>

          <button
            type="button"
            className="connexion-link"
            onClick={deconnexion}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Déconnexion
          </button>
        </>
      )}
    </>
  )

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-mark">🌿</div>

          <div className="logo-content">
            <strong>Marché Artisans</strong>
            <span>Le savoir-faire local</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={menuOuvert ? 'nav-links ouvert' : 'nav-links'}>
          <NavLink to="/" end>
            Accueil
          </NavLink>

          <NavLink to="/produits">
            Produits
          </NavLink>

          <a href="/#categories">
            Catégories
          </a>

          <a href="/#a-propos">
            À propos
          </a>

          {/* Liens du compte, visibles dans le menu sur mobile */}
          <div className="nav-mobile-user">
            {liensUtilisateur}
          </div>
        </nav>

        {/* Actions */}
        <div className="navbar-actions">

          <button
            className="nav-search-button"
            type="button"
            aria-label="Rechercher"
          >
            🔍
          </button>

          <div
            className="navbar-user"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            {liensUtilisateur}
          </div>

          <button
            className="cart-button"
            type="button"
            onClick={() => navigate('/panier')}
          >
            🛒
            <span>Panier</span>
            <b>{panier.nombre_articles}</b>
          </button>

          <button
            type="button"
            className="nav-burger"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOuvert}
            onClick={() => setMenuOuvert(!menuOuvert)}
          >
            {menuOuvert ? '✕' : '☰'}
          </button>

        </div>

      </div>
    </header>
  )
}

export default Navbar