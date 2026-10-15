import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Connexion() {

  const { utilisateur, seConnecter, sInscrire, seDeconnecter } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mode, setMode] = useState('connexion') // 'connexion' ou 'inscription'
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    role: 'client',
    nom_entreprise: '',
  })

  const modifier = (champ) => (e) =>
    setForm({ ...form, [champ]: e.target.value })

  const changerMode = (nouveauMode) => {
    setMode(nouveauMode)
    setErreur('')
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)

    try {
      let u
      if (mode === 'connexion') {
        u = await seConnecter(form.email, form.mot_de_passe)
      } else {
        u = await sInscrire(form)
      }

      const retour = location.state?.from
      if (retour && retour !== '/') {
        navigate(retour)
      } else if (u.role === 'admin') {
        navigate('/admin')
      } else if (u.role === 'artisan') {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail) {
        setErreur(detail)
      } else if (err.response) {
        setErreur('Une erreur est survenue. Vérifie les champs.')
      } else {
        setErreur('Impossible de joindre le serveur.')
      }
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
    marginBottom: '14px',
    boxSizing: 'border-box',
  }

  const styleOnglet = (actif) => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    borderBottom: actif ? '3px solid #0a6b3d' : '3px solid transparent',
    background: 'transparent',
    color: actif ? '#0a6b3d' : '#666',
    fontWeight: actif ? 700 : 400,
    fontSize: '1rem',
    cursor: 'pointer',
  })

  // Déjà connectée : on affiche un résumé
  if (utilisateur) {
    return (
      <section className="products-section">
        <div style={{ maxWidth: '440px', margin: '0 auto' }}>
          <h2>Bonjour {utilisateur.prenom} 👋</h2>
          <p style={{ margin: '12px 0' }}>
            Connecté en tant que <strong>{utilisateur.email}</strong>
            {' '}({utilisateur.role}).
          </p>
          <button
            type="button"
            className="add-cart"
            style={{ width: 'auto', padding: '12px 24px' }}
            onClick={seDeconnecter}
          >
            Se déconnecter
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="products-section">

      <div style={{ maxWidth: '440px', margin: '0 auto' }}>

        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <button
            type="button"
            style={styleOnglet(mode === 'connexion')}
            onClick={() => changerMode('connexion')}
          >
            Se connecter
          </button>
          <button
            type="button"
            style={styleOnglet(mode === 'inscription')}
            onClick={() => changerMode('inscription')}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={soumettre}>

          {mode === 'inscription' && (
            <>
              <select
                value={form.role}
                onChange={modifier('role')}
                style={styleChamp}
              >
                <option value="client">Je suis client</option>
                <option value="artisan">Je suis artisan</option>
              </select>

              <input
                type="text"
                placeholder="Prénom"
                value={form.prenom}
                onChange={modifier('prenom')}
                style={styleChamp}
                required
              />

              <input
                type="text"
                placeholder="Nom"
                value={form.nom}
                onChange={modifier('nom')}
                style={styleChamp}
                required
              />

              {form.role === 'artisan' && (
                <input
                  type="text"
                  placeholder="Nom de votre entreprise / atelier"
                  value={form.nom_entreprise}
                  onChange={modifier('nom_entreprise')}
                  style={styleChamp}
                  required
                />
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={modifier('email')}
            style={styleChamp}
            required
          />

          <input
            type="password"
            placeholder="Mot de passe (8 caractères minimum)"
            value={form.mot_de_passe}
            onChange={modifier('mot_de_passe')}
            style={styleChamp}
            required
          />

          {erreur && (
            <p style={{ color: '#b00020', marginBottom: '14px' }}>
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
              ? 'Veuillez patienter…'
              : mode === 'connexion'
                ? 'Se connecter'
                : 'Créer mon compte'}
          </button>

        </form>

      </div>

    </section>
  )
}

export default Connexion