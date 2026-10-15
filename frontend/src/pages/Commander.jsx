import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePanier } from '../context/PanierContext'
import { passerCommande } from '../services/commandeService'
import { formaterPrix } from '../utils/produits'

const MODES_PAIEMENT = [
  { valeur: 'especes', label: 'Espèces à la livraison' },
  { valeur: 'mobile_money', label: 'Mobile Money' },
  { valeur: 'carte', label: 'Carte bancaire' },
  { valeur: 'virement', label: 'Virement' },
]

function Commander() {

  const { panier, recharger } = usePanier()
  const navigate = useNavigate()

  const [adresse, setAdresse] = useState('')
  const [mode, setMode] = useState('especes')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const lignes = panier.lignes || []

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)

    try {
      const commande = await passerCommande(adresse, mode)
      await recharger()
      navigate('/mes-commandes', {
        state: { nouvelle: commande.id_commande },
      })
    } catch (err) {
      setErreur(
        err.response?.data?.detail || 'Impossible de valider la commande.'
      )
      // Le stock a peut-être changé : on rafraîchit le panier
      recharger()
    } finally {
      setEnvoi(false)
    }
  }

  const styleChamp = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d6d6d6',
    borderRadius: '10px',
    fontSize: '1rem',
    marginBottom: '16px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  if (lignes.length === 0) {
    return (
      <section className="products-section">
        <h2>Valider la commande</h2>
        <p style={{ margin: '16px 0' }}>Votre panier est vide.</p>
        <Link to="/produits" className="view-link">
          Découvrir les produits →
        </Link>
      </section>
    )
  }

  return (
    <section className="products-section">

      <div className="section-heading">
        <div>
          <span className="section-label">
            COMMANDE
          </span>

          <h2>
            Valider la commande
          </h2>

          <p>
            Indiquez où vous livrer et comment vous souhaitez payer.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          alignItems: 'start',
        }}
      >

        <form onSubmit={soumettre}>

          <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Adresse de livraison
          </label>

          <textarea
            rows={3}
            placeholder="Quartier, rue, ville, repère…"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            style={styleChamp}
            required
          />

          <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Mode de paiement
          </label>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={styleChamp}
          >
            {MODES_PAIEMENT.map((m) => (
              <option key={m.valeur} value={m.valeur}>
                {m.label}
              </option>
            ))}
          </select>

          {erreur && (
            <p style={{ color: '#b00020', marginBottom: '16px' }}>
              {erreur}
            </p>
          )}

          <button
            type="submit"
            className="add-cart"
            disabled={envoi}
            style={{
              width: '100%',
              padding: '14px',
              opacity: envoi ? 0.6 : 1,
            }}
          >
            {envoi ? 'Validation en cours…' : 'Confirmer la commande'}
          </button>

          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            Le paiement sera enregistré « en attente » : le paiement en ligne
            sera simulé à l'étape suivante.
          </p>

        </form>


        <div
          style={{
            padding: '24px',
            border: '1px solid #e3e3e3',
            borderRadius: '16px',
            background: '#fff',
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Votre commande
          </h3>

          {lignes.map((l) => (
            <p
              key={l.id_ligne_panier}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                margin: '10px 0',
              }}
            >
              <span>{l.nom} × {l.quantite}</span>
              <span>{formaterPrix(l.sous_total)}</span>
            </p>
          ))}

          <p
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.3rem',
              fontWeight: 700,
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #e3e3e3',
            }}
          >
            <span>Total</span>
            <span>{formaterPrix(panier.total)}</span>
          </p>

          <Link to="/panier" className="view-link">
            ← Modifier le panier
          </Link>
        </div>

      </div>

    </section>
  )
}

export default Commander