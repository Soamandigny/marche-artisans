import { useEffect, useState } from 'react'
import { getToutesCommandes } from '../services/adminService'
import { changerStatutCommande } from '../services/artisanService'
import { construireImage, formaterPrix } from '../utils/produits'

const BOUTONS = {
  confirmee: 'Confirmer',
  preparee: 'Marquer préparée',
  expediee: 'Marquer expédiée',
  livree: 'Marquer livrée',
  annulee: 'Annuler',
}

const STATUTS = [
  ['en_attente', 'En attente'],
  ['confirmee', 'Confirmée'],
  ['preparee', 'Préparée'],
  ['expediee', 'Expédiée'],
  ['livree', 'Livrée'],
  ['annulee', 'Annulée'],
]

function AdminCommandes() {

  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(null)
  const [filtre, setFiltre] = useState('')
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        setCommandes(await getToutesCommandes())
      } catch (err) {
        console.error('Erreur commandes :', err)
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
      // On garde la liste des artisans, absente de la réponse
      setCommandes((liste) =>
        liste.map((x) =>
          x.id_commande === maj.id_commande ? { ...x, ...maj } : x
        )
      )
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Impossible de changer le statut.')
    } finally {
      setEnCours(null)
    }
  }

  const mot = recherche.trim().toLowerCase()

  const affichees = commandes.filter((c) => {
    if (filtre && c.statut !== filtre) return false
    if (!mot) return true
    return (
      String(c.id_commande).includes(mot) ||
      c.client.toLowerCase().includes(mot) ||
      c.artisans.join(' ').toLowerCase().includes(mot)
    )
  })

  const classeStatut = (statut) =>
    statut === 'annulee'
      ? 'dash-badge danger'
      : statut === 'en_attente'
        ? 'dash-badge warn'
        : 'dash-badge'

  const styleChamp = {
    padding: '10px 14px',
    border: '1px solid #d6d6d6',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">ADMINISTRATION</span>
          <h2>Toutes les commandes</h2>
          <p>Suivez et faites avancer chaque commande de la marketplace.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          placeholder="Rechercher (n°, client, artisan)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ ...styleChamp, flex: '1 1 260px' }}
        />
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          style={{ ...styleChamp, flex: '0 0 200px' }}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {erreur && (
        <p style={{ color: '#b00020', marginBottom: '16px' }}>{erreur}</p>
      )}

      {loading && <p>Chargement des commandes…</p>}

      {!loading && (
        <p style={{ marginBottom: '12px' }}>
          {affichees.length} commande{affichees.length > 1 ? 's' : ''}
        </p>
      )}

      {affichees.map((c) => (

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
              <h3 style={{ margin: 0 }}>Commande n°{c.id_commande}</h3>
              <div>
                {new Date(c.date_commande).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                {c.client}
              </div>
              <div>Artisan{c.artisans.length > 1 ? 's' : ''} : {c.artisans.join(', ')}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={classeStatut(c.statut)}>{c.statut_label}</span>
              <div style={{ marginTop: '6px' }}>
                <strong>{formaterPrix(c.montant)}</strong>
              </div>
            </div>
          </div>

          {c.lignes.map((l) => (
            <div className="dash-row" key={`${c.id_commande}-${l.id_produit}`}>
              <img src={construireImage(l.image)} alt={l.nom} />
              <div className="dash-row-main">{l.nom} × {l.quantite}</div>
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
              <div><strong>Livraison :</strong> {c.livraison.statut_label}</div>
            )}
          </div>

          {c.actions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
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

export default AdminCommandes