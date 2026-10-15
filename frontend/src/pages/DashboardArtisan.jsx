import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTableauDeBord } from '../services/artisanService'
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

function DashboardArtisan() {

  const { utilisateur } = useAuth()

  const [donnees, setDonnees] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        setDonnees(await getTableauDeBord())
      } catch (err) {
        console.error('Erreur tableau de bord :', err)
        setErreur('Impossible de charger le tableau de bord.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  if (loading) return <p>Chargement du tableau de bord…</p>
  if (erreur) return <p>{erreur}</p>
  if (!donnees) return null

  const s = donnees.stats

  const classeStock = (stock) =>
    stock === 0 ? 'dash-badge danger' : stock <= 5 ? 'dash-badge warn' : 'dash-badge'

  const texteStock = (stock) =>
    stock === 0 ? 'Rupture' : `${stock} en stock`

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">
            TABLEAU DE BORD
          </span>

          <h2>
            Bonjour {utilisateur.prenom} 👋
          </h2>

          <p>
            {donnees.portee === 'artisan'
              ? `Voici l'activité de ${donnees.nom_entreprise}.`
              : "Vue globale de la marketplace (compte administrateur)."}
          </p>
        </div>
      </div>

      <div className="dash-cards">

        <Carte
          label="Chiffre d'affaires"
          valeur={formaterPrix(s.chiffre_affaires)}
          note={`${s.articles_vendus} article${s.articles_vendus > 1 ? 's' : ''} vendu${s.articles_vendus > 1 ? 's' : ''}`}
        />

        <Carte
          label="Commandes reçues"
          valeur={s.nombre_commandes}
          note={
            s.commandes_en_attente > 0
              ? `${s.commandes_en_attente} en attente`
              : 'Aucune en attente'
          }
          alerte={s.commandes_en_attente > 0}
        />

        <Carte
          label="Produits"
          valeur={s.nombre_produits}
          note={`${s.stock_total} unité${s.stock_total > 1 ? 's' : ''} en stock`}
        />

        <Carte
          label="Valeur du stock"
          valeur={formaterPrix(s.valeur_stock)}
          note={
            s.ruptures + s.stock_faible > 0
              ? `${s.ruptures} rupture${s.ruptures > 1 ? 's' : ''}, ${s.stock_faible} stock faible`
              : 'Stocks suffisants'
          }
          alerte={s.ruptures + s.stock_faible > 0}
        />

      </div>

      <div className="dash-panels">

        <div className="dash-panel">
          <h3>Stocks à surveiller</h3>

          {donnees.a_surveiller.length === 0 && (
            <p>Aucun produit pour le moment.</p>
          )}

          {donnees.a_surveiller.map((p) => (
            <div className="dash-row" key={p.id_produit}>
              <img src={construireImage(p.image)} alt={p.nom} />
              <div className="dash-row-main">
                <strong>{p.nom}</strong>
                <div>{formaterPrix(p.prix)}</div>
              </div>
              <span className={classeStock(p.stock)}>
                {texteStock(p.stock)}
              </span>
            </div>
          ))}
        </div>

        <div className="dash-panel">
          <h3>Dernières commandes</h3>

          {donnees.dernieres_commandes.length === 0 && (
            <p>Aucune commande reçue pour le moment.</p>
          )}

          {donnees.dernieres_commandes.map((c) => (
            <div className="dash-row" key={c.id_commande}>
              <div className="dash-row-main">
                <strong>Commande n°{c.id_commande}</strong>
                <div>
                  {new Date(c.date_commande).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>{formaterPrix(c.montant)}</strong></div>
                <span className="dash-badge">{c.statut_label}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  )
}

export default DashboardArtisan