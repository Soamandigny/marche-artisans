import Hero from '../components/Hero'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProduits } from '../services/productService'
import { getCategories } from '../services/categorieService'
import { convertirProduit, iconeCategorie } from '../utils/produits'
import AddToCartButton from '../components/AddToCartButton'

function Accueil() {

  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const listeProduits = Array.isArray(produits) ? produits : []
  const listeCategories = Array.isArray(categories) ? categories : []

  const products = listeProduits.map(convertirProduit)

  return (
    <div className="home-page">

      {/* ==================================================
          HERO
      ================================================== */}

      <Hero />


      {/* ==================================================
          CATÉGORIES
      ================================================== */}

      <section
        className="categories-section"
        id="categories"
      >

        <div className="section-heading">

          <div>
            <span className="section-label">
              EXPLOREZ
            </span>

            <h2>
              Découvrez nos catégories
            </h2>

            <p>
              Trouvez facilement les produits qui vous correspondent.
            </p>
          </div>

          <Link to="/produits" className="view-link">
            Voir tout →
          </Link>

        </div>


        <div className="categories-grid">

          {listeCategories.map((category) => (

            <Link
              className="category-card"
              key={category.id_categorie}
              to={`/produits?categorie=${category.id_categorie}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >

              <div className="category-icon">
                {iconeCategorie(category.nom)}
              </div>

              <div>
                <h3>
                  {category.nom}
                </h3>

                <p>
                  {category.description || 'Découvrir les produits'}
                </p>
              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>

          ))}

        </div>

      </section>


      {/* ==================================================
          PRODUITS
      ================================================== */}

      <section
        className="products-section"
        id="produits"
      >

        <div className="section-heading">

          <div>

            <span className="section-label">
              NOS PRODUITS
            </span>

            <h2>
              Les coups de cœur du moment
            </h2>

            <p>
              Découvrez quelques créations proposées par nos artisans.
            </p>

          </div>

          <Link
            to="/produits"
            className="view-link"
          >
            Voir tous les produits →
          </Link>

        </div>


        {loading && <p>Chargement des produits…</p>}

        {!loading && error && <p>{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>Aucun produit pour le moment.</p>
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


      {/* ==================================================
          AVANTAGES
      ================================================== */}

      <section className="advantages-section">

        <div className="advantage">

          <div className="advantage-icon">
            🌿
          </div>

          <div>
            <h3>
              Produits locaux
            </h3>

            <p>
              Soutenez directement nos artisans.
            </p>
          </div>

        </div>


        <div className="advantage">

          <div className="advantage-icon">
            🛡️
          </div>

          <div>
            <h3>
              Paiement sécurisé
            </h3>

            <p>
              Vos transactions sont protégées.
            </p>
          </div>

        </div>


        <div className="advantage">

          <div className="advantage-icon">
            🚚
          </div>

          <div>
            <h3>
              Livraison
            </h3>

            <p>
              Recevez vos commandes facilement.
            </p>
          </div>

        </div>


        <div className="advantage">

          <div className="advantage-icon">
            ❤️
          </div>

          <div>
            <h3>
              Fait avec passion
            </h3>

            <p>
              Chaque création raconte une histoire.
            </p>
          </div>

        </div>

      </section>


      {/* ==================================================
          À PROPOS
      ================================================== */}

            <section
        className="about-section"
        id="a-propos"
      >

        <div className="about-image">
          <a href="/images/mpd.svg" target="_blank" rel="noreferrer">
            <img
              src="/images/mpd.svg"
              alt="Modèle physique de données (MPD) du projet"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e3e3e3',
              }}
            />
          </a>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '8px' }}>
            MPD du projet (cliquez pour agrandir)
          </p>
        </div>


        <div className="about-content">

          <span className="section-label">
            NOTRE MISSION
          </span>

          <h2>
            Valoriser le savoir-faire
            <span> de nos artisans</span>
          </h2>

          <p>
            Notre marketplace permet aux artisans locaux de
            présenter leurs créations et de toucher davantage
            de clients.
          </p>

          <p>
            Chaque achat contribue à valoriser leur travail,
            leurs compétences et notre patrimoine artisanal.
          </p>

          <p>
            La plateforme repose sur une base relationnelle de
            11 tables : utilisateurs, artisans, clients, catégories,
            produits, paniers, commandes, paiements et livraisons.
          </p>

          <Link
            to="/produits"
            className="about-button"
          >
            Découvrir le marketplace →
          </Link>

        </div>

      </section>
      {/* ==================================================
          CTA
      ================================================== */}

      <section className="cta-section">

        <div>

          <span>
            🌿 VOUS ÊTES ARTISAN ?
          </span>

          <h2>
            Faites connaître vos créations
          </h2>

          <p>
            Rejoignez notre marketplace et présentez
            vos produits à de nouveaux clients.
          </p>

        </div>

        <button type="button">
          Devenir artisan →
        </button>

      </section>

    </div>
  )
}

export default Accueil