import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  getPanier,
  ajouterAuPanier,
  changerQuantite,
  supprimerLigne,
} from '../services/panierService'

const PanierContext = createContext(null)

const PANIER_VIDE = {
  lignes: [],
  total: '0.00',
  nombre_articles: 0,
}

export function PanierProvider({ children }) {

  const { utilisateur } = useAuth()
  const [panier, setPanier] = useState(PANIER_VIDE)

  const recharger = useCallback(async () => {
    try {
      setPanier(await getPanier())
    } catch (err) {
      console.error('Erreur panier :', err)
    }
  }, [])

  // Charge le panier d'un client connecté, le vide sinon
  useEffect(() => {
    if (utilisateur && utilisateur.role === 'client') {
      recharger()
    } else {
      setPanier(PANIER_VIDE)
    }
  }, [utilisateur, recharger])

  const ajouter = async (idProduit, quantite = 1) => {
    setPanier(await ajouterAuPanier(idProduit, quantite))
  }

  const modifierQuantite = async (idLigne, quantite) => {
    setPanier(await changerQuantite(idLigne, quantite))
  }

  const retirer = async (idLigne) => {
    setPanier(await supprimerLigne(idLigne))
  }

  return (
    <PanierContext.Provider
      value={{ panier, recharger, ajouter, modifierQuantite, retirer }}
    >
      {children}
    </PanierContext.Provider>
  )
}

export const usePanier = () => useContext(PanierContext)