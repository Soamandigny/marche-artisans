import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ roles }) {

  const { utilisateur, chargement } = useAuth()
  const location = useLocation()

  if (chargement) {
    return <p style={{ padding: '40px' }}>Chargement…</p>
  }

  if (!utilisateur) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (roles && !roles.includes(utilisateur.role)) {
    return <Navigate to="/acces-refuse" replace />
  }

  return <Outlet />
}

export default ProtectedRoute