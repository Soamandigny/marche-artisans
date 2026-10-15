import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduit } from '../services/productService'
import { convertirProduit } from '../utils/produits'
import AddToCartButton from '../components/AddToCartButton'

function ProduitDetail() {

  const { id } = useParams()

  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const charger = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await getProduit(id)
        setProduit(convertirProduit(data))
      } catch (err) {
        console.error('Erreur API Django :', err)

        if (err.response && err.response.status === 404) {
          setError('Ce produit n’existe pas.')
        } else {
          setError('Impossible de récupérer le produit.')
        }
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [id])

  return (
    <section className="products-section">

      <Link to="/produits" className="view-link">
        ← Retour aux produits
      </Link>

      {loading && <p style={{ marginTop: '24px' }}>Chargement du produit…</p>}

      {!loading && error && <p style={{ marginTop: '24px' }}>{error}</p>}

      {!loading && !error && produit && (

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            marginTop: '24px',
            alignItems: 'start',
          }}
        >

          <div>
            <img
              src={produit.image}
              alt={produit.name}
              style={{
                width: '100%',
                borderRadius: '16px',
                objectFit: 'cover',
                maxHeight: '520px',
              }}
            />
          </div>


          <div>

            {produit.categorieNom && (
              <span className="section-label">
                {produit.categorieNom.toUpperCase()}
              </span>
            )}

            <h2 style={{ margin: '8px 0' }}>
              {produit.name}
            </h2>

            <p className="artisan-name">
              Par {produit.artisan}
            </p>

            <div className="product-stars" style={{ margin: '12px 0' }}>
              ★★★★★
              <span>
                4.8
              </span>
            </div>

            <p
              style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                margin: '16px 0',
              }}
            >
              {produit.price}
            </p>

            <p style={{ margin: '16px 0', lineHeight: 1.6 }}>
              {produit.description || 'Aucune description pour ce produit.'}
            </p>

            <p style={{ margin: '16px 0', fontWeight: 600 }}>
              {produit.stock > 0
                ? `✔ En stock (${produit.stock} disponible${produit.stock > 1 ? 's' : ''})`
                : '✖ Rupture de stock'}
            </p>

            <AddToCartButton
              idProduit={produit.id}
              disabled={produit.stock === 0}
              style={{
                width: 'auto',
                padding: '12px 24px',
                opacity: produit.stock === 0 ? 0.5 : 1,
              }}
            >
              🛒 Ajouter au panier
            </AddToCartButton>

          </div>

        </div>

      )}

    </section>
  )
}

export default ProduitDetail