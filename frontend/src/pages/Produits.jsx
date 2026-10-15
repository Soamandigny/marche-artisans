import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProduits } from '../services/productService'
import { getCategories } from '../services/categorieService'
import { convertirProduit } from '../utils/produits'
import AddToCartButton from '../components/AddToCartButton'

function Produits() {

  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const categorieActive = searchParams.get('categorie') || ''
  const [recherche, setRecherche] = useState(
    searchParams.get('recherche') || ''
  )

  // Chargement des données (une seule fois)
  useEffect(() => {
    const chargerProduits = async () => {
      try {
        const data = await getProduits()
        setProduits(data.results || data)
      } catch (err) {
        console.error('Erreur API Django :', err)
        setError('Impossible de récupérer les produits.')
      } finally {
        setLoading(false)
      }
    }

    const chargerCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data.results || data)
      } catch (err) {
        console.error('Erreur API catégories :', err)
      }
    }

    chargerProduits()
    chargerCategories()
  }, [])

  // Synchronise la recherche avec l'URL (recherche lancée depuis le hero)
  useEffect(() => {
    setRecherche(searchParams.get('recherche') || '')
  }, [searchParams])

  const choisirCategorie = (id) => {
    const params = {}
    if (id) params.categorie = id
    if (recherche) params.recherche = recherche
    setSearchParams(params)
  }

  const listeProduits = Array.isArray(produits) ? produits : []
  const listeCategories = Array.isArray(categories) ? categories : []

  const products = listeProduits
    .map(convertirProduit)
    .filter((p) =>
      p.name.toLowerCase().includes(recherche.toLowerCase())
    )
    .filter((p) =>
      categorieActive === '' || String(p.categorieId) === categorieActive
    )

  const styleBouton = (actif) => ({
    padding: '8px 18px',
    borderRadius: '999px',
    border: '1px solid #0a6b3d',
    background: actif ? '#0a6b3d' : 'transparent',
    color: actif ? '#fff' : '#0a6b3d',
    cursor: 'pointer',
    fontSize: '0.95rem',
  })

  return (
    <section className="products-section">

      <div className="section-heading">

        <div>
          <span className="section-label">
            CATALOGUE
          </span>

          <h2>
            Nos produits
          </h2>

          <p>
            Découvrez les produits proposés par nos artisans locaux.
          </p>
        </div>

      </div>


      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '12px 16px',
          marginBottom: '20px',
          border: '1px solid #d6d6d6',
          borderRadius: '10px',
          fontSize: '1rem',
        }}
      />


      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '24px',
        }}
      >

        <button
          type="button"
          style={styleBouton(categorieActive === '')}
          onClick={() => choisirCategorie('')}
        >
          Toutes
        </button>

        {listeCategories.map((c) => (
          <button
            key={c.id_categorie}
            type="button"
            style={styleBouton(categorieActive === String(c.id_categorie))}
            onClick={() => choisirCategorie(c.id_categorie)}
          >
            {c.nom}
          </button>
        ))}

      </div>


      {loading && <p>Chargement des produits…</p>}

      {!loading && error && <p>{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p>
          {categorieActive !== '' && recherche === ''
            ? 'Aucun produit dans cette catégorie pour le moment.'
            : 'Aucun produit ne correspond à votre recherche.'}
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <p style={{ marginBottom: '16px' }}>
          {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
        </p>
      )}


      <div className="products-grid">

        {products.map((product) => (

          <article
            className="product-card"
            key={product.id}
          >

            <div className="product-image">

              <Link to={`/produits/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                />
              </Link>

              <button
                className="favorite-button"
                type="button"
                aria-label="Ajouter aux favoris"
              >
                ♡
              </button>

              <span className="local-badge">
                LOCAL
              </span>

            </div>


            <div className="product-info">

              <div className="product-stars">
                ★★★★★
                <span>
                  4.8
                </span>
              </div>

              <h3>
                <Link
                  to={`/produits/${product.id}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {product.name}
                </Link>
              </h3>

              <p className="artisan-name">
                {product.artisan}
                {product.categorieNom && ` · ${product.categorieNom}`}
              </p>

              <div className="product-footer">

                <strong>
                  {product.price}
                </strong>

                <AddToCartButton idProduit={product.id} />

              </div>

            </div>

          </article>

        ))}

      </div>

    </section>
  )
}

export default Produits