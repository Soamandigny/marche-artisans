import { useEffect, useState } from 'react'
import { getCategories } from '../services/categorieService'
import {
  creerCategorie,
  modifierCategorie,
  supprimerCategorie,
} from '../services/adminService'

const messageErreur = (err) => {
  const d = err.response?.data
  if (!d) return 'Impossible de joindre le serveur.'
  if (typeof d === 'string') return 'Erreur du serveur. Réessayez.'
  if (d.detail) return d.detail
  return Object.entries(d)
    .map(([champ, msg]) => `${champ} : ${Array.isArray(msg) ? msg.join(' ') : msg}`)
    .join(' — ')
}

function AdminCategories() {

  const [liste, setListe] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [edition, setEdition] = useState(null) // {id, nom, description}

  useEffect(() => {
    const charger = async () => {
      try {
        const data = await getCategories()
        setListe(data.results || data)
      } catch (err) {
        console.error('Erreur catégories :', err)
        setErreur('Impossible de récupérer les catégories.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  const ajouter = async (e) => {
    e.preventDefault()
    setErreur('')

    try {
      const c = await creerCategorie({ nom: nom.trim(), description: description.trim() || null })
      setListe((l) => [...l, c].sort((a, b) => a.nom.localeCompare(b.nom)))
      setNom('')
      setDescription('')
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }

  const enregistrer = async () => {
    setErreur('')

    try {
      const c = await modifierCategorie(edition.id, {
        nom: edition.nom.trim(),
        description: edition.description.trim() || null,
      })
      setListe((l) =>
        l.map((x) => (x.id_categorie === c.id_categorie ? c : x))
          .sort((a, b) => a.nom.localeCompare(b.nom))
      )
      setEdition(null)
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }

  const supprimer = async (c) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return
    setErreur('')

    try {
      await supprimerCategorie(c.id_categorie)
      setListe((l) => l.filter((x) => x.id_categorie !== c.id_categorie))
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }

  const styleChamp = {
    padding: '10px 14px',
    border: '1px solid #d6d6d6',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const bouton = (couleur) => ({
    padding: '8px 14px',
    border: `1px solid ${couleur}`,
    borderRadius: '8px',
    color: couleur,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.9rem',
  })

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">
            ADMINISTRATION
          </span>

          <h2>
            Catégories
          </h2>

          <p>
            Organisez le catalogue de la marketplace.
          </p>
        </div>
      </div>

      {erreur && (
        <p style={{ color: '#b00020', marginBottom: '16px' }}>
          {erreur}
        </p>
      )}

      <form
        onSubmit={ajouter}
        className="dash-panel"
        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}
      >
        <input
          placeholder="Nom de la catégorie"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={{ ...styleChamp, flex: '1 1 200px' }}
          maxLength={100}
          required
        />
        <input
          placeholder="Description (facultatif)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...styleChamp, flex: '2 1 260px' }}
        />
        <button
          type="submit"
          className="add-cart"
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          + Ajouter
        </button>
      </form>

      {loading && <p>Chargement…</p>}

      <div className="dash-panel">

        {liste.map((c) => (

          <div className="dash-row" key={c.id_categorie} style={{ flexWrap: 'wrap' }}>

            {edition?.id === c.id_categorie ? (
              <>
                <input
                  value={edition.nom}
                  onChange={(e) => setEdition({ ...edition, nom: e.target.value })}
                  style={{ ...styleChamp, flex: '1 1 160px' }}
                />
                <input
                  value={edition.description}
                  onChange={(e) => setEdition({ ...edition, description: e.target.value })}
                  style={{ ...styleChamp, flex: '2 1 200px' }}
                />
                <button type="button" style={bouton('#0a6b3d')} onClick={enregistrer}>
                  Enregistrer
                </button>
                <button type="button" style={bouton('#666')} onClick={() => setEdition(null)}>
                  Annuler
                </button>
              </>
            ) : (
              <>
                <div className="dash-row-main" style={{ minWidth: '160px' }}>
                  <strong>{c.nom}</strong>
                  <div>{c.description || 'Aucune description'}</div>
                </div>

                <button
                  type="button"
                  style={bouton('#0a6b3d')}
                  onClick={() =>
                    setEdition({
                      id: c.id_categorie,
                      nom: c.nom,
                      description: c.description || '',
                    })
                  }
                >
                  Modifier
                </button>

                <button type="button" style={bouton('#b00020')} onClick={() => supprimer(c)}>
                  Supprimer
                </button>
              </>
            )}

          </div>

        ))}

      </div>

    </div>
  )
}

export default AdminCategories