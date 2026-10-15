import { useEffect, useState } from 'react'
import {
  changerStatutCommande,
  getCommandesRecues,
} from '../services/artisanService'
import { construireImage, formaterPrix } from '../utils/produits'

const BOUTONS = {
  confirmee: 'Confirmer',
  preparee: 'Marquer préparée',
  expediee: 'Marquer expédiée',
  livree: 'Marquer livrée',
  annulee: 'Annuler',
}

function CommandesRecues() {

  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(null)

  useEffect(() => {
    const charger = async () => {
      try {
        setCommandes(await getCommandesRecues())
      } catch (err) {
        console.error('Erreur commandes reçues :', err)
        setErreur('Impossible de récupérer les commandes.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  const changer = async (c, statut) => {
    if (statut === 'annulee') {
      const ok = window.confirm(
        `Annuler la commande n°${c.id_commande} ? Le stock sera remis et un paiement déjà réglé sera marqué comme remboursé.`
      )
      if (!ok) return
    }

    setErreur('')
    setEnCours(c.id_commande)

    try {
      const maj = await changerStatutCommande(c.id_commande, statut)
      setCommandes((liste) =>
        liste.map((x) => (x.id_commande === maj.id_commande ? maj : x))
      )
    } catch (err) {
      setErreur(
        err.response?.data?.detail || 'Impossible de changer le statut.'
      )
    } finally {
      setEnCours(null)
    }
  }

  const classeStatut = (statut) =>
    statut === 'annulee'
      ? 'dash-badge danger'
      : statut === 'en_attente'
        ? 'dash-badge warn'
        : 'dash-badge'

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">
            COMMANDES
          </span>

          <h2>
            Commandes reçues
          </h2>

          <p>
            Faites avancer les commandes qui contiennent vos produits.
          </p>
        </div>
      </div>

      {erreur && (
        <p style={{ color: '#b00020', marginBottom: '16px' }}>
          {erreur}
        </p>
      )}

      {loading && <p>Chargement des commandes…</p>}

      {!loading && commandes.length === 0 && !erreur && (
        <p>Vous n'avez pas encore reçu de commande.</p>
      )}

      {commandes.map((c) => (

        <div
          className="dash-panel"
          key={c.id_commande}
          style={{
            marginBottom: '20px',
            opacity: enCours === c.id_commande ? 0.5 : 1,
          }}
        >

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                Commande n°{c.id_commande}
              </h3>
              <div>
                {new Date(c.date_commande).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                {c.client}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={classeStatut(c.statut)}>
                {c.statut_label}
              </span>
              <div style={{ marginTop: '6px' }}>
                <strong>{formaterPrix(c.montant)}</strong>
              </div>
            </div>
          </div>

          {c.lignes.map((l) => (
            <div className="dash-row" key={`${c.id_commande}-${l.id_produit}`}>
              <img src={construireImage(l.image)} alt={l.nom} />
              <div className="dash-row-main">
                {l.nom} × {l.quantite}
              </div>
              <span>{formaterPrix(l.sous_total)}</span>
            </div>
          ))}

          <div
            style={{
              borderTop: '1px solid #f0f0f0',
              paddingTop: '10px',
              lineHeight: 1.7,
              fontSize: '0.95rem',
            }}
          >
            <div><strong>Adresse :</strong> {c.adresse_livraison}</div>
            {c.paiement && (
              <div>
                <strong>Paiement :</strong> {c.paiement.mode_label} ({c.paiement.statut_label})
              </div>
            )}
            {c.livraison && (
              <div>
                <strong>Livraison :</strong> {c.livraison.statut_label}
              </div>
            )}
          </div>

          {!c.gerable && (
            <p style={{ marginTop: '10px', color: '#a35d00' }}>
              Cette commande contient aussi des produits d'autres artisans :
              son statut est géré par l'administrateur.
            </p>
          )}

          {c.actions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '14px',
              }}
            >
              {c.actions.map((statut) => (
                <button
                  key={statut}
                  type="button"
                  disabled={enCours !== null}
                  onClick={() => changer(c, statut)}
                  className={statut === 'annulee' ? '' : 'add-cart'}
                  style={
                    statut === 'annulee'
                      ? {
                          padding: '10px 18px',
                          border: '1px solid #b00020',
                          borderRadius: '8px',
                          color: '#b00020',
                          background: 'transparent',
                          cursor: 'pointer',
                        }
                      : { width: 'auto', padding: '10px 18px' }
                  }
                >
                  {BOUTONS[statut]}
                </button>
              ))}
            </div>
          )}

        </div>

      ))}

    </div>
  )
}

export default CommandesRecues