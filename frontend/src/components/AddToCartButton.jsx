import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePanier } from '../context/PanierContext'
import { useToast } from '../context/ToastContext'

function AddToCartButton({
  idProduit,
  disabled = false,
  className = 'add-cart',
  style,
  children = '🛒',
}) {

  const { utilisateur } = useAuth()
  const { ajouter } = usePanier()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [etat, setEtat] = useState('repos') // 'repos' | 'envoi' | 'ok'

  const cliquer = async () => {
    if (!utilisateur) {
      navigate('/connexion', {
        state: { from: location.pathname + location.search },
      })
      return
    }

    if (utilisateur.role !== 'client') {
      notifier('Le panier est réservé aux comptes clients.', 'erreur')
      return
    }

    setEtat('envoi')

    try {
      await ajouter(idProduit, 1)
      setEtat('ok')
      notifier('Produit ajouté au panier.')
      setTimeout(() => setEtat('repos'), 1500)
    } catch (err) {
      setEtat('repos')
      notifier(
        err.response?.data?.detail || "Impossible d'ajouter au panier.",
        'erreur'
      )
    }
  }

  return (
    <button
      className={className}
      type="button"
      onClick={cliquer}
      disabled={disabled || etat === 'envoi'}
      style={style}
    >
      {etat === 'ok' ? '✓' : children}
    </button>
  )
}

export default AddToCartButton