import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getMesCommandes } from '../services/commandeService'
import { construireImage, formaterPrix } from '../utils/produits'

const ETAPES_LIVRAISON = [
  { code: 'en_attente', label: 'En attente' },
  { code: 'preparee', label: 'Préparée' },
  { code: 'expediee', label: 'Expédiée' },
  { code: 'livree', label: 'Livrée' },
]

function FriseLivraison({ statut }) {

  const indexActuel = ETAPES_LIVRAISON.findIndex((e) => e.code === statut)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        margin: '16px 0 8px',
      }}
    >
      {ETAPES_LIVRAISON.map((etape, i) => {
        const atteinte = i <= indexActuel
        const courante = i === indexActuel

        return (
          <div
            key={etape.code}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              textAlign: 'center',
            }}
          >

            {/* Trait de liaison avec l'étape précédente */}
            {i > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '13px',
                  right: '50%',
                  width: '100%',
                  height: '3px',
                  background: atteinte ? '#0a6b3d' : '#e3e3e3',
                }}
              />
            )}

            {/* Pastille */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: atteinte ? '#0a6b3d' : '#fff',
                border: `3px solid ${atteinte ? '#0a6b3d' : '#e3e3e3'}`,
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                boxShadow: courante ? '0 0 0 4px #cfe8d8' : 'none',
              }}
            >
              {atteinte ? '✓' : ''}
            </div>

            <span
              style={{
                marginTop: '8px',
                fontSize: '0.85rem',
                fontWeight: courante ? 700 : 400,
                color: atteinte ? '#0a6b3d' : '#888',
              }}
            >
              {etape.label}
            </span>

          </div>
        )
      })}
    </div>
  )
}

function MesCommandes() {

  const location = useLocation()
  const nouvelle = location.state?.nouvelle
  const payee = location.state?.paye

  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        setCommandes(await getMesCommandes())
      } catch (err) {
        console.error('Erreur commandes :', err)
        setError('Impossible de récupérer vos commandes.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  const badge = (annulee) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    background: annulee ? '#fdeaea' : '#e6f2ea',
    color: annulee ? '#b00020' : '#0a6b3d',
    fontSize: '0.85rem',
    fontWeight: 600,
  })

  const peutPayer = (c) =>
    c.statut !== 'annulee' &&
    c.paiement &&
    ['mobile_money', 'carte'].includes(c.paiement.mode) &&
    ['en_attente', 'echoue'].includes(c.paiement.statut)

  const styleMessage = {
    padding: '14px 18px',
    borderRadius: '12px',
    background: '#e6f2ea',
    color: '#0a6b3d',
    fontWeight: 600,
    marginBottom: '24px',
  }

  return (
    <section className="products-section">

      <div className="section-heading">
        <div>
          <span className="section-label">
            MON COMPTE
          </span>

          <h2>
            Mes commandes
          </h2>

          <p>
            Suivez l'état de vos commandes et de leur livraison.
          </p>
        </div>
      </div>

      {nouvelle && (
        <p style={styleMessage}>
          ✓ Commande n°{nouvelle} enregistrée. Merci pour votre achat !
        </p>
      )}

      {payee && (
        <p style={styleMessage}>
          ✓ Paiement de la commande n°{payee} effectué. Elle est confirmée.
        </p>
      )}

      {loading && <p>Chargement de vos commandes…</p>}

      {!loading && error && <p>{error}</p>}

      {!loading && !error && commandes.length === 0 && (
        <div>
          <p style={{ marginBottom: '16px' }}>
            Vous n'avez pas encore passé de commande.
          </p>
          <Link to="/produits" className="view-link">
            Découvrir les produits →
          </Link>
        </div>
      )}

      {commandes.map((c) => (

        <article
          key={c.id_commande}
          style={{
            border: '1px solid #e3e3e3',
            borderRadius: '16px',
            background: '#fff',
            padding: '20px',
            marginBottom: '20px',
            outline:
              c.id_commande === nouvelle || c.id_commande === payee
                ? '2px solid #0a6b3d'
                : 'none',
          }}
        >

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                Commande n°{c.id_commande}
              </h3>
              <p style={{ marginTop: '4px' }}>
                {new Date(c.date_commande).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={badge(c.statut === 'annulee')}>
                {c.statut_label}
              </span>
              <p style={{ fontWeight: 700, fontSize: '1.2rem', marginTop: '8px' }}>
                {formaterPrix(c.montant_total)}
              </p>
            </div>
          </div>

          {c.lignes.map((l) => (
            <div
              key={`${c.id_commande}-${l.id_produit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                borderTop: '1px solid #f0f0f0',
              }}
            >
              <img
                src={construireImage(l.image)}
                alt={l.nom}
                style={{
                  width: '56px',
                  height: '56px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
              <span style={{ flex: 1 }}>
                {l.nom} × {l.quantite}
              </span>
              <span>{formaterPrix(l.sous_total)}</span>
            </div>
          ))}

          {/* Suivi de livraison */}
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <strong>Suivi de livraison</strong>

            {c.statut === 'annulee' ? (
              <p style={{ color: '#b00020', marginTop: '8px' }}>
                Cette commande a été annulée.
              </p>
            ) : c.livraison ? (
              <FriseLivraison statut={c.livraison.statut} />
            ) : (
              <p style={{ marginTop: '8px' }}>
                Aucune information de livraison.
              </p>
            )}
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f0f0f0',
              fontSize: '0.95rem',
              lineHeight: 1.7,
            }}
          >
            <div><strong>Adresse :</strong> {c.adresse_livraison}</div>
            {c.paiement && (
              <div>
                <strong>Paiement :</strong> {c.paiement.mode_label} ({c.paiement.statut_label})
              </div>
            )}
          </div>

          {peutPayer(c) && (
            <Link
              to={`/payer/${c.id_commande}`}
              className="add-cart"
              style={{
                display: 'inline-block',
                width: 'auto',
                marginTop: '16px',
                padding: '12px 24px',
                textDecoration: 'none',
              }}
            >
              {c.paiement.statut === 'echoue'
                ? 'Réessayer le paiement'
                : 'Payer maintenant'}
            </Link>
          )}

        </article>

      ))}

    </section>
  )
}

export default MesCommandes