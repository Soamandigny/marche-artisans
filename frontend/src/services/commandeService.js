import api from './api'

export const passerCommande = async (adresse_livraison, mode_paiement) => {
  const response = await api.post('commander/', {
    adresse_livraison,
    mode_paiement,
  })
  return response.data
}

export const getMesCommandes = async () => {
  const response = await api.get('mes-commandes/')
  return response.data
}

export const getMaCommande = async (id) => {
  const response = await api.get(`mes-commandes/${id}/`)
  return response.data
}

export const payerCommande = async (id, donnees = {}) => {
  const response = await api.post(`mes-commandes/${id}/payer/`, donnees)
  return response.data
}