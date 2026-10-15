import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getMesProduits, supprimerProduit } from '../services/productService'
import { construireImage, formaterPrix } from '../utils/produits'

function MesProduits() {

  const location = useLocation()
  const message = location.state?.message

  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(null)

  useEffect(() => {
    const charger = async () => {
      try {
        setProduits(await getMesProduits())
      } catch (err) {
        console.error('Erreur produits :', err)
        setErreur('Impossible de récupérer vos produits.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  const supprimer = async (p) => {
    if (!window.confirm(`Supprimer « ${p.nom} » ? Cette action est définitive.`)) {
      return
    }

    setErreur('')
    setEnCours(p.id_produit)

    try {
      await supprimerProduit(p.id_produit)
      setProduits((liste) => liste.filter((x) => x.id_produit !== p.id_produit))
    } catch (err) {
      setErreur(
        err.response?.data?.detail || 'Impossible de supprimer ce produit.'
      )
    } finally {
      setEnCours(null)
    }
  }

  const classeStock = (stock) =>
    stock === 0 ? 'dash-badge danger' : stock <= 5 ? 'dash-badge warn' : 'dash-badge'

  const texteStock = (stock) =>
    stock === 0 ? 'Rupture' : `${stock} en stock`

  const boutonLien = {
    padding: '8px 14px',
    border: '1px solid #0a6b3d',
    borderRadius: '8px',
    color: '#0a6b3d',
    textDecoration: 'none',
    fontSize: '0.9rem',
  }

  const boutonSupprimer = {
    padding: '8px 14px',
    border: '1px solid #b00020',
    borderRadius: '8px',
    color: '#b00020',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.9rem',
  }

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">
            MES PRODUITS
          </span>

          <h2>
            Gérer mes produits
          </h2>

          <p>
            Ajoutez, modifiez ou retirez les produits que vous vendez.
          </p>
        </div>

        <Link
          to="/dashboard/produits/nouveau"
          className="add-cart"
          style={{
            width: 'auto',
            padding: '12px 20px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          + Ajouter un produit
        </Link>
      </div>

      {message && (
        <p
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: '#e6f2ea',
            color: '#0a6b3d',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          ✓ {message}
        </p>
      )}

      {erreur && (
        <p style={{ color: '#b00020', marginBottom: '16px' }}>
          {erreur}
        </p>
      )}

      {loading && <p>Chargement de vos produits…</p>}

      {!loading && produits.length === 0 && !erreur && (
        <p>Vous n'avez pas encore de produit. Cliquez sur « Ajouter un produit ».</p>
      )}

      {produits.length > 0 && (
        <div className="dash-panel">

          {produits.map((p) => (

            <div
              className="dash-row"
              key={p.id_produit}
              style={{
                flexWrap: 'wrap',
                opacity: enCours === p.id_produit ? 0.5 : 1,
              }}
            >

              <img src={construireImage(p.image)} alt={p.nom} />

              <div className="dash-row-main" style={{ minWidth: '140px' }}>
                <strong>{p.nom}</strong>
                <div>
                  {formaterPrix(p.prix)} · {p.categorie_nom}
                </div>
              </div>

              <span className={classeStock(p.stock)}>
                {texteStock(p.stock)}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to={`/dashboard/produits/${p.id_produit}/modifier`}
                  style={boutonLien}
                >
                  Modifier
                </Link>

                <button
                  type="button"
                  style={boutonSupprimer}
                  disabled={enCours !== null}
                  onClick={() => supprimer(p)}
                >
                  Supprimer
                </button>
              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  )
}

export default MesProduits