import api from './api'

export const getProduits = async () => {
  const response = await api.get('produits/')
  return response.data
}

export const getProduit = async (id) => {
  try {
    const response = await api.get(`produits/${id}/`)
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Secours : on cherche le produit dans la liste
      const data = await getProduits()
      const liste = data.results || data
      const trouve = Array.isArray(liste)
        ? liste.find((p) => String(p.id_produit) === String(id))
        : null
      if (trouve) return trouve
    }
    throw err
  }
}

// Espace artisan

export const getMesProduits = async () => {
  const response = await api.get('produits/mes-produits/')
  return response.data
}

export const creerProduit = async (donnees) => {
  const response = await api.post('produits/', donnees)
  return response.data
}

export const modifierProduit = async (id, donnees) => {
  const response = await api.patch(`produits/${id}/`, donnees)
  return response.data
}

export const supprimerProduit = async (id) => {
  await api.delete(`produits/${id}/`)
}