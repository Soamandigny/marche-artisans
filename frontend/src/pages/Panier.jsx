import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePanier } from '../context/PanierContext'
import { construireImage, formaterPrix } from '../utils/produits'

function Panier() {

  const { panier, modifierQuantite, retirer } = usePanier()
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(null) // id de la ligne en cours de modification

  const lignes = panier.lignes || []

  const executer = async (idLigne, action) => {
    setErreur('')
    setEnCours(idLigne)
    try {
      await action()
    } catch (err) {
      setErreur(
        err.response?.data?.detail || 'Une erreur est survenue. Réessayez.'
      )
    } finally {
      setEnCours(null)
    }
  }

  const changer = (ligne, nouvelle) =>
    executer(ligne.id_ligne_panier, () =>
      modifierQuantite(ligne.id_ligne_panier, nouvelle)
    )

  const supprimer = (ligne) =>
    executer(ligne.id_ligne_panier, () => retirer(ligne.id_ligne_panier))

  const styleQte = {
    width: '34px',
    height: '34px',
    border: '1px solid #0a6b3d',
    background: 'transparent',
    color: '#0a6b3d',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  }

  return (
    <section className="products-section">

      <div className="section-heading">
        <div>
          <span className="section-label">
            MON PANIER
          </span>

          <h2>
            Votre panier
          </h2>

          <p>
            Vérifiez vos articles avant de valider la commande.
          </p>
        </div>
      </div>

      {erreur && (
        <p style={{ color: '#b00020', marginBottom: '16px' }}>
          {erreur}
        </p>
      )}

      {lignes.length === 0 && (
        <div>
          <p style={{ marginBottom: '16px' }}>
            Votre panier est vide.
          </p>
          <Link to="/produits" className="view-link">
            Découvrir les produits →
          </Link>
        </div>
      )}

      {lignes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >

          {/* Liste des lignes */}
          <div className="panier-liste">

            {lignes.map((ligne) => (

              <div
                key={ligne.id_ligne_panier}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 0',
                  borderBottom: '1px solid #e3e3e3',
                  opacity: enCours === ligne.id_ligne_panier ? 0.5 : 1,
                }}
              >

                <Link to={`/produits/${ligne.id_produit}`}>
                  <img
                    src={construireImage(ligne.image)}
                    alt={ligne.nom}
                    style={{
                      width: '90px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />
                </Link>

                <div style={{ flex: '1 1 160px' }}>
                  <h3 style={{ margin: 0 }}>
                    <Link
                      to={`/produits/${ligne.id_produit}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {ligne.nom}
                    </Link>
                  </h3>

                  <p className="artisan-name">
                    {ligne.artisan_nom}
                  </p>

                  <p style={{ marginTop: '4px' }}>
                    {formaterPrix(ligne.prix)} l'unité
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    style={styleQte}
                    disabled={enCours !== null || ligne.quantite <= 1}
                    onClick={() => changer(ligne, ligne.quantite - 1)}
                    aria-label="Diminuer la quantité"
                  >
                    −
                  </button>

                  <strong>{ligne.quantite}</strong>

                  <button
                    type="button"
                    style={styleQte}
                    disabled={enCours !== null || ligne.quantite >= ligne.stock}
                    onClick={() => changer(ligne, ligne.quantite + 1)}
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>

                <strong style={{ minWidth: '110px', textAlign: 'right' }}>
                  {formaterPrix(ligne.sous_total)}
                </strong>

                <button
                  type="button"
                  disabled={enCours !== null}
                  onClick={() => supprimer(ligne)}
                  aria-label="Retirer du panier"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                  }}
                >
                  🗑️
                </button>

              </div>

            ))}

          </div>

          {/* Récapitulatif */}
          <div
            style={{
              padding: '24px',
              border: '1px solid #e3e3e3',
              borderRadius: '16px',
              background: '#fff',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Récapitulatif
            </h3>

            <p style={{ margin: '12px 0' }}>
              {panier.nombre_articles} article{panier.nombre_articles > 1 ? 's' : ''}
            </p>

            <p
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.3rem',
                fontWeight: 700,
                margin: '16px 0',
              }}
            >
              <span>Total</span>
              <span>{formaterPrix(panier.total)}</span>
            </p>

            <Link
              to="/commander"
              className="add-cart"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                textAlign: 'center',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Valider la commande →
            </Link>

            <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
              Le prix final est recalculé par le serveur lors de la commande.
            </p>
          </div>

        </div>
      )}

    </section>
  )
}

export default Panier