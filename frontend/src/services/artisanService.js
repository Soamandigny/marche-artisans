import api from './api'

export const getTableauDeBord = async () => {
  const response = await api.get('artisan/tableau-de-bord/')
  return response.data
}

export const getCommandesRecues = async () => {
  const response = await api.get('artisan/commandes/')
  return response.data
}

export const changerStatutCommande = async (id, statut) => {
  const response = await api.post(`artisan/commandes/${id}/statut/`, { statut })
  return response.data
}