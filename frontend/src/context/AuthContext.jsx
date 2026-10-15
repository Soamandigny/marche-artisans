import { createContext, useContext, useEffect, useState } from 'react'
import {
  connexion as apiConnexion,
  inscription as apiInscription,
  getMoi,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [utilisateur, setUtilisateur] = useState(null)
  const [chargement, setChargement] = useState(true)

  // Au démarrage : si un token existe, on récupère l'utilisateur
  useEffect(() => {
    const restaurer = async () => {
      if (!localStorage.getItem('token')) {
        setChargement(false)
        return
      }

      try {
        const data = await getMoi()
        setUtilisateur(data)
      } catch {
        localStorage.removeItem('token')
        setUtilisateur(null)
      } finally {
        setChargement(false)
      }
    }

    restaurer()
  }, [])

  const enregistrerSession = (data) => {
    localStorage.setItem('token', data.token)
    setUtilisateur(data.utilisateur)
    return data.utilisateur
  }

  const seConnecter = async (email, motDePasse) => {
    const data = await apiConnexion(email, motDePasse)
    return enregistrerSession(data)
  }

  const sInscrire = async (donnees) => {
    const data = await apiInscription(donnees)
    return enregistrerSession(data)
  }

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    setUtilisateur(null)
  }

  return (
    <AuthContext.Provider
      value={{ utilisateur, chargement, seConnecter, sInscrire, seDeconnecter }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)