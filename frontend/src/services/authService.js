import api from './api'

export const inscription = async (donnees) => {
  const response = await api.post('auth/inscription/', donnees)
  return response.data
}

export const connexion = async (email, mot_de_passe) => {
  const response = await api.post('auth/connexion/', { email, mot_de_passe })
  return response.data
}

export const getMoi = async () => {
  const response = await api.get('auth/moi/')
  return response.data
}