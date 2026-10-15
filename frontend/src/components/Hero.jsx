import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Hero() {

  const [recherche, setRecherche] = useState('')
  const navigate = useNavigate()

  const lancerRecherche = (e) => {
    e.preventDefault()
    const mot = recherche.trim()
    navigate(
      mot
        ? `/produits?recherche=${encodeURIComponent(mot)}`
        : '/produits'
    )
  }

  return (
    <section className="hero">

      <div className="hero-background"></div>

      <div className="hero-container">

        <div className="hero-content">

          <span className="hero-tag">
            ✨ L'artisanat local à portée de clic
          </span>

          <h1>
            Découvrez des créations
            <span> uniques et authentiques</span>
          </h1>

          <p>
            Achetez directement auprès de nos artisans locaux
            et découvrez des produits fabriqués avec passion,
            créativité et savoir-faire.
          </p>

          {/* Recherche */}
          <form
            className="hero-search"
            onSubmit={lancerRecherche}
          >

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />

            <button type="submit">
              Rechercher
            </button>

          </form>

          {/* Bouton */}
          <div className="hero-buttons">

            <a
              href="#produits"
              className="primary-button"
            >
              Découvrir les produits
              <span>→</span>
            </a>

            <a
              href="#categories"
              className="secondary-button"
            >
              Explorer les catégories
            </a>

          </div>

          {/* Petites informations */}
          <div className="hero-infos">

            <div>
              <strong>100+</strong>
              <span>Artisans</span>
            </div>

            <div>
              <strong>500+</strong>
              <span>Produits</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Local</span>
            </div>

          </div>

        </div>

      </div>

    </section>
  )
}

export default Hero