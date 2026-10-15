import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="products-section">
      <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '4rem', margin: 0 }}>404</p>
        <h2>Page introuvable</h2>
        <p style={{ margin: '16px 0' }}>
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="view-link">
          ← Retour à l'accueil
        </Link>
      </div>
    </section>
  )
}

export default NotFound