import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  creerUtilisateur,
  getUtilisateurs,
  supprimerUtilisateur,
} from '../services/adminService'

const FORM_VIDE = {
  prenom: '',
  nom: '',
  email: '',
  mot_de_passe: '',
  role: 'client',
  nom_entreprise: '',
}

function AdminUtilisateurs() {

  const { utilisateur } = useAuth()

  const [liste, setListe] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('')
  const [formOuvert, setFormOuvert] = useState(false)
  const [form, setForm] = useState(FORM_VIDE)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    const charger = async () => {
      try {
        setListe(await getUtilisateurs())
      } catch (err) {
        console.error('Erreur utilisateurs :', err)
        setErreur('Impossible de récupérer les utilisateurs.')
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [])

  const modifier = (champ) => (e) =>
    setForm({ ...form, [champ]: e.target.value })

  const creer = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    setEnvoi(true)

    try {
      const nouveau = await creerUtilisateur(form)
      setListe((l) => [nouveau, ...l])
      setMessage(`Compte de ${nouveau.prenom} ${nouveau.nom} créé.`)
      setForm(FORM_VIDE)
      setFormOuvert(false)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Impossible de créer le compte.')
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async (u) => {
    if (!window.confirm(
      `Supprimer le compte de ${u.prenom} ${u.nom} ? Cette action est définitive.`
    )) return

    setErreur('')
    setMessage('')

    try {
      await supprimerUtilisateur(u.id_utilisateur)
      setListe((l) => l.filter((x) => x.id_utilisateur !== u.id_utilisateur))
      setMessage('Compte supprimé.')
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Impossible de supprimer ce compte.')
    }
  }

  const mot = recherche.trim().toLowerCase()

  const affiches = liste.filter((u) => {
    if (filtreRole && u.role !== filtreRole) return false
    if (!mot) return true
    return [u.nom, u.prenom, u.email, u.nom_entreprise || '']
      .join(' ')
      .toLowerCase()
      .includes(mot)
  })

  const styleChamp = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d6d6d6',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const classeRole = (role) =>
    role === 'admin' ? 'dash-badge danger' : role === 'artisan' ? 'dash-badge warn' : 'dash-badge'

  return (
    <div>

      <div className="section-heading">
        <div>
          <span className="section-label">
            ADMINISTRATION
          </span>

          <h2>
            Utilisateurs
          </h2>

          <p>
            Clients, artisans et administrateurs de la marketplace.
          </p>
        </div>

        <button
          type="button"
          className="add-cart"
          style={{ width: 'auto', padding: '12px 20px' }}
          onClick={() => setFormOuvert(!formOuvert)}
        >
          {formOuvert ? 'Fermer' : '+ Créer un compte'}
        </button>
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

      {formOuvert && (
        <form
          onSubmit={creer}
          className="dash-panel"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <select value={form.role} onChange={modifier('role')} style={styleChamp}>
            <option value="client">Client</option>
            <option value="artisan">Artisan</option>
            <option value="admin">Administrateur</option>
          </select>

          <input placeholder="Prénom" value={form.prenom}
            onChange={modifier('prenom')} style={styleChamp} required />

          <input placeholder="Nom" value={form.nom}
            onChange={modifier('nom')} style={styleChamp} required />

          <input type="email" placeholder="Email" value={form.email}
            onChange={modifier('email')} style={styleChamp} required />

          <input type="password" placeholder="Mot de passe (8 caractères min.)"
            value={form.mot_de_passe} onChange={modifier('mot_de_passe')}
            style={styleChamp} required />

          {form.role === 'artisan' && (
            <input placeholder="Nom de l'entreprise" value={form.nom_entreprise}
              onChange={modifier('nom_entreprise')} style={styleChamp} required />
          )}

          <button
            type="submit"
            className="add-cart"
            disabled={envoi}
            style={{ padding: '12px', opacity: envoi ? 0.6 : 1 }}
          >
            {envoi ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          placeholder="Rechercher (nom, email, entreprise)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ ...styleChamp, flex: '1 1 260px', width: 'auto' }}
        />

        <select
          value={filtreRole}
          onChange={(e) => setFiltreRole(e.target.value)}
          style={{ ...styleChamp, flex: '0 0 200px', width: 'auto' }}
        >
          <option value="">Tous les rôles</option>
          <option value="client">Clients</option>
          <option value="artisan">Artisans</option>
          <option value="admin">Administrateurs</option>
        </select>
      </div>

      {loading && <p>Chargement…</p>}

      {!loading && (
        <p style={{ marginBottom: '12px' }}>
          {affiches.length} utilisateur{affiches.length > 1 ? 's' : ''}
        </p>
      )}

      <div className="dash-panel">

        {affiches.map((u) => (

          <div className="dash-row" key={u.id_utilisateur} style={{ flexWrap: 'wrap' }}>

            <div className="dash-row-main" style={{ minWidth: '200px' }}>
              <strong>{u.prenom} {u.nom}</strong>
              <div>{u.email}</div>
              {u.nom_entreprise && (
                <div>
                  {u.nom_entreprise} · {u.nombre_produits} produit{u.nombre_produits > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <span className={classeRole(u.role)}>{u.role_label}</span>

            <div style={{ fontSize: '0.85rem', minWidth: '110px' }}>
              {new Date(u.date_creation).toLocaleDateString('fr-FR')}
            </div>

            <button
              type="button"
              disabled={u.id_utilisateur === utilisateur.id_utilisateur}
              onClick={() => supprimer(u)}
              style={{
                padding: '8px 14px',
                border: '1px solid #b00020',
                borderRadius: '8px',
                color: '#b00020',
                background: 'transparent',
                cursor:
                  u.id_utilisateur === utilisateur.id_utilisateur
                    ? 'not-allowed'
                    : 'pointer',
                opacity: u.id_utilisateur === utilisateur.id_utilisateur ? 0.4 : 1,
              }}
            >
              Supprimer
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}

export default AdminUtilisateurs