import { Link } from 'react-router-dom'

function AccesRefuse() {
  return (
    <section className="products-section">
      <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Accès refusé 🔒</h2>
        <p style={{ margin: '16px 0' }}>
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </p>
        <Link to="/" className="view-link">
          ← Retour à l'accueil
        </Link>
      </div>
    </section>
  )
}

export default AccesRefuse