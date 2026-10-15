import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  creerProduit,
  getProduit,
  modifierProduit,
} from '../services/productService'
import { getCategories } from '../services/categorieService'
import { construireImage } from '../utils/produits'

const messageErreur = (err) => {
  const d = err.response?.data

  if (!d) return 'Impossible de joindre le serveur.'
  if (typeof d === 'string') return 'Erreur du serveur. Réessayez.'
  if (d.detail) return d.detail

  return Object.entries(d)
    .map(([champ, msg]) => `${champ} : ${Array.isArray(msg) ? msg.join(' ') : msg}`)
    .join(' — ')
}

function ProduitForm() {

  const { id } = useParams()
  const edition = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix: '',
    stock: '0',
    id_categorie: '',
    image: '',
  })
  const [loading, setLoading] = useState(edition)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    const charger = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats.results || cats)

        if (edition) {
          const p = await getProduit(id)
          setForm({
            nom: p.nom || '',
            description: p.description || '',
            prix: p.prix || '',
            stock: String(p.stock ?? 0),
            id_categorie: String(p.id_categorie || ''),
            image: p.image || '',
          })
        }
      } catch (err) {
        console.error('Erreur chargement formulaire :', err)
        setErreur('Impossible de charger les données.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [id, edition])

  const modifier = (champ) => (e) =>
    setForm({ ...form, [champ]: e.target.value })

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)

    const donnees = {
      nom: form.nom.trim(),
      description: form.description.trim(),
      prix: form.prix,
      stock: Number(form.stock),
      id_categorie: Number(form.id_categorie),
      image: form.image.trim() || null,
    }

    try {
      if (edition) {
        await modifierProduit(id, donnees)
      } else {
        await creerProduit(donnees)
      }

      navigate('/dashboard/produits', {
        state: {
          message: edition
            ? `Le produit « ${donnees.nom} » a été modifié.`
            : `Le produit « ${donnees.nom} » a été ajouté.`,
        },
      })
    } catch (err) {
      setErreur(messageErreur(err))
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

  const styleLabel = {
    fontWeight: 600,
    display: 'block',
    marginBottom: '8px',
  }

  return (
    <div>

      <Link to="/dashboard/produits" className="view-link">
        ← Retour à mes produits
      </Link>

      <div className="section-heading" style={{ marginTop: '16px' }}>
        <div>
          <span className="section-label">
            {edition ? 'MODIFICATION' : 'NOUVEAU PRODUIT'}
          </span>

          <h2>
            {edition ? 'Modifier le produit' : 'Ajouter un produit'}
          </h2>
        </div>
      </div>

      {loading && <p>Chargement…</p>}

      {!loading && (
        <form onSubmit={soumettre} style={{ maxWidth: '560px' }}>

          <label style={styleLabel}>Nom du produit</label>
          <input
            type="text"
            value={form.nom}
            onChange={modifier('nom')}
            style={styleChamp}
            maxLength={150}
            required
          />

          <label style={styleLabel}>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={modifier('description')}
            style={styleChamp}
          />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

            <div style={{ flex: '1 1 200px' }}>
              <label style={styleLabel}>Prix (Ar)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prix}
                onChange={modifier('prix')}
                style={styleChamp}
                required
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <label style={styleLabel}>Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={modifier('stock')}
                style={styleChamp}
                required
              />
            </div>

          </div>

          <label style={styleLabel}>Catégorie</label>
          <select
            value={form.id_categorie}
            onChange={modifier('id_categorie')}
            style={styleChamp}
            required
          >
            <option value="">— Choisir une catégorie —</option>
            {categories.map((c) => (
              <option key={c.id_categorie} value={c.id_categorie}>
                {c.nom}
              </option>
            ))}
          </select>

          <label style={styleLabel}>Image</label>
          <input
            type="text"
            placeholder="bracelet.jpg"
            value={form.image}
            onChange={modifier('image')}
            style={{ ...styleChamp, marginBottom: '8px' }}
          />
          <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
            Nom d'un fichier placé dans <code>frontend/public/images/</code>
            {' '}(ex. <code>bracelet.jpg</code>). Laisse vide pour l'image par défaut.
          </p>

          <img
            src={construireImage(form.image.trim())}
            alt="Aperçu"
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginBottom: '20px',
              background: '#eee',
            }}
          />

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
            {envoi
              ? 'Enregistrement…'
              : edition
                ? 'Enregistrer les modifications'
                : 'Ajouter le produit'}
          </button>

        </form>
      )}

    </div>
  )
}

export default ProduitForm