import api from './api'

export const getPanier = async () => {
  const response = await api.get('panier/')
  return response.data
}

export const ajouterAuPanier = async (idProduit, quantite = 1) => {
  const response = await api.post('panier/ajouter/', {
    id_produit: idProduit,
    quantite,
  })
  return response.data
}

export const changerQuantite = async (idLigne, quantite) => {
  const response = await api.patch(`panier/lignes/${idLigne}/`, { quantite })
  return response.data
}

export const supprimerLigne = async (idLigne) => {
  const response = await api.delete(`panier/lignes/${idLigne}/`)
  return response.data
}