import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMaCommande, payerCommande } from '../services/commandeService'
import { formaterPrix } from '../utils/produits'

function PayerCommande() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [numero, setNumero] = useState('')
  const [simulerEchec, setSimulerEchec] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    const charger = async () => {
      try {
        setCommande(await getMaCommande(id))
      } catch (err) {
        console.error('Erreur commande :', err)
        setErreur(
          err.response?.status === 404
            ? "Cette commande n'existe pas."
            : 'Impossible de récupérer la commande.'
        )
      } finally {
        setLoading(false)
      }
    }

    charger()
  }, [id])

  const mode = commande?.paiement?.mode
  const statutPaiement = commande?.paiement?.statut

  const payable =
    commande &&
    commande.statut !== 'annulee' &&
    ['mobile_money', 'carte'].includes(mode) &&
    ['en_attente', 'echoue'].includes(statutPaiement)

  const payer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)

    try {
      const donnees = {}
      if (mode === 'mobile_money') donnees.numero = numero
      if (simulerEchec) donnees.simuler = 'echec'

      const resultat = await payerCommande(id, donnees)

      if (resultat.paiement?.statut === 'paye') {
        navigate('/mes-commandes', { state: { paye: resultat.id_commande } })
      } else {
        setCommande(resultat)
        setErreur("Le paiement a échoué. Vous pouvez réessayer.")
      }
    } catch (err) {
      setErreur(
        err.response?.data?.detail || 'Impossible de traiter le paiement.'
      )
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
  }

  return (
    <section className="products-section">

      <div className="section-heading">
        <div>
          <span className="section-label">
            PAIEMENT
          </span>

          <h2>
            Payer la commande {commande ? `n°${commande.id_commande}` : ''}
          </h2>

          <p>
            Paiement en mode simulation : aucun argent réel n'est débité.
          </p>
        </div>
      </div>

      {loading && <p>Chargement…</p>}

      {!loading && !commande && erreur && <p>{erreur}</p>}

      {commande && (
        <div
          style={{
            maxWidth: '480px',
            padding: '24px',
            border: '1px solid #e3e3e3',
            borderRadius: '16px',
            background: '#fff',
          }}
        >

          <p
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.3rem',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            <span>Montant</span>
            <span>{formaterPrix(commande.montant_total)}</span>
          </p>

          <p style={{ marginBottom: '20px' }}>
            Mode : {commande.paiement?.mode_label} ({commande.paiement?.statut_label})
          </p>

          {!payable && (
            <div>
              <p style={{ marginBottom: '16px' }}>
                {statutPaiement === 'paye'
                  ? '✓ Cette commande est déjà payée.'
                  : "Cette commande ne peut pas être payée en ligne."}
              </p>
              <Link to="/mes-commandes" className="view-link">
                ← Mes commandes
              </Link>
            </div>
          )}

          {payable && (
            <form onSubmit={payer}>

              {mode === 'mobile_money' && (
                <>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    Numéro Mobile Money
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="03X XX XXX XX"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    style={styleChamp}
                    required
                  />
                </>
              )}

              {mode === 'carte' && (
                <p style={{ marginBottom: '16px' }}>
                  Simulation : aucune donnée de carte n'est demandée ni
                  enregistrée.
                </p>
              )}

              {import.meta.env.DEV && (
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={simulerEchec}
                    onChange={(e) => setSimulerEchec(e.target.checked)}
                  />
                  {' '}Simuler un échec (test)
                </label>
              )}

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
                  ? 'Paiement en cours…'
                  : `Payer ${formaterPrix(commande.montant_total)}`}
              </button>

              <p style={{ marginTop: '16px' }}>
                <Link to="/mes-commandes" className="view-link">
                  ← Payer plus tard
                </Link>
              </p>

            </form>
          )}

        </div>
      )}

    </section>
  )
}

export default PayerCommande