import { useEffect, useState } from 'react'
import { getStatistiques } from '../services/adminService'
import { construireImage, formaterPrix } from '../utils/produits'

function Carte({ label, valeur, note, alerte }) {
  return (
    <div className="dash-card">
      <div className="dash-card-label">{label}</div>
      <div className="dash-card-value">{valeur}</div>
      {note && (
        <div className={alerte ? 'dash-card-note alert' : 'dash-card-note'}>
          {note}
        </div>
      )}
    </div>
  )
}

function AdminStatistiques() {

  const [s, setS] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        setS(await getStatistiques())
      } catch (err) {
        console.error('Erreur statistiques :', err)
        setErreur('Impossible de charger les statistiques.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  if (loading) return <p>Chargement des statistiques…</p>
  if (erreur) return <p>{erreur}</p>
  if (!s) return null

  const maxStatut = Math.max(1, ...s.statuts.map((x) => x.nombre))

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">ADMINISTRATION</span>
          <h2>Statistiques</h2>
          <p>Vue globale de la marketplace.</p>
        </div>
      </div>

      <div className="dash-cards">
        <Carte
          label="Chiffre d'affaires"
          valeur={formaterPrix(s.chiffre_affaires)}
          note={`${s.articles_vendus} article${s.articles_vendus > 1 ? 's' : ''} vendu${s.articles_vendus > 1 ? 's' : ''} (hors annulées)`}
        />
        <Carte
          label="Encaissé"
          valeur={formaterPrix(s.encaisse)}
          note="Paiements au statut « Payé »"
        />
        <Carte
          label="Commandes"
          valeur={s.nombre_commandes}
          note={`${s.statuts.find((x) => x.code === 'en_attente')?.nombre || 0} en attente`}
        />
        <Carte
          label="Utilisateurs"
          valeur={s.utilisateurs.client + s.utilisateurs.artisan + s.utilisateurs.admin}
          note={`${s.utilisateurs.client} clients, ${s.utilisateurs.artisan} artisans, ${s.utilisateurs.admin} admin`}
        />
        <Carte
          label="Produits"
          valeur={s.nombre_produits}
          note={s.ruptures > 0 ? `${s.ruptures} en rupture` : 'Aucune rupture'}
          alerte={s.ruptures > 0}
        />
      </div>

      <div className="dash-panels">

        <div className="dash-panel">
          <h3>Commandes par statut</h3>

          {s.statuts.map((x) => (
            <div key={x.code} style={{ margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{x.label}</span>
                <strong>{x.nombre}</strong>
              </div>
              <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '999px' }}>
                <div
                  style={{
                    height: '8px',
                    width: `${(x.nombre / maxStatut) * 100}%`,
                    background: x.code === 'annulee' ? '#b00020' : '#0a6b3d',
                    borderRadius: '999px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="dash-panel">
          <h3>Meilleurs produits</h3>

          {s.top_produits.length === 0 && <p>Aucune vente pour le moment.</p>}

          {s.top_produits.map((p) => (
            <div className="dash-row" key={p.id_produit}>
              <img src={construireImage(p.image)} alt={p.nom} />
              <div className="dash-row-main">
                <strong>{p.nom}</strong>
                <div>{p.vendus} vendu{p.vendus > 1 ? 's' : ''}</div>
              </div>
              <strong>{formaterPrix(p.total)}</strong>
            </div>
          ))}
        </div>

        <div className="dash-panel">
          <h3>Meilleurs artisans</h3>

          {s.top_artisans.length === 0 && <p>Aucune vente pour le moment.</p>}

          {s.top_artisans.map((a) => (
            <div className="dash-row" key={a.id_artisan}>
              <div className="dash-row-main">
                <strong>{a.nom}</strong>
                <div>{a.vendus} article{a.vendus > 1 ? 's' : ''} vendu{a.vendus > 1 ? 's' : ''}</div>
              </div>
              <strong>{formaterPrix(a.total)}</strong>
            </div>
          ))}
        </div>

      </div>

    </div>
  )
}

export default AdminStatistiques