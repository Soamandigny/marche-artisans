export const IMAGE_PAR_DEFAUT = '/images/defaut.jpg'

export const formaterPrix = (prix) =>
  `${Number(prix).toLocaleString('fr-FR')} Ar`

export const construireImage = (image) => {
  if (!image) return IMAGE_PAR_DEFAUT
  if (image.startsWith('http') || image.startsWith('/')) return image
  return `/images/${image}`
}

export const convertirProduit = (p) => ({
  id: p.id_produit,
  image: construireImage(p.image),
  name: p.nom,
  artisan: p.artisan_nom || 'Artisan local',
  price: formaterPrix(p.prix),
  description: p.description || '',
  stock: p.stock ?? 0,
  categorieId: p.id_categorie,
  categorieNom: p.categorie_nom || '',
})

const ICONES_CATEGORIES = {
  bijoux: '💍',
  décoration: '🏺',
  decoration: '🏺',
  vêtements: '👗',
  vetements: '👗',
  artisanat: '🧺',
  mode: '👗',
  beauté: '🌿',
  beaute: '🌿',
}

export const iconeCategorie = (nom) =>
  ICONES_CATEGORIES[(nom || '').toLowerCase()] || '🏷️'