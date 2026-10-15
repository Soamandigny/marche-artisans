import api from './api'

export const getUtilisateurs = async () => {
  const response = await api.get('gestion/utilisateurs/')
  return response.data
}

export const creerUtilisateur = async (donnees) => {
  const response = await api.post('gestion/utilisateurs/', donnees)
  return response.data
}

export const supprimerUtilisateur = async (id) => {
  await api.delete(`gestion/utilisateurs/${id}/`)
}

export const creerCategorie = async (donnees) => {
  const response = await api.post('categories/', donnees)
  return response.data
}

export const modifierCategorie = async (id, donnees) => {
  const response = await api.patch(`categories/${id}/`, donnees)
  return response.data
}

export const supprimerCategorie = async (id) => {
  await api.delete(`categories/${id}/`)
}

export const getStatistiques = async () => {
  const response = await api.get('gestion/statistiques/')
  return response.data
}

export const getToutesCommandes = async () => {
  const response = await api.get('gestion/commandes/')
  return response.data
}