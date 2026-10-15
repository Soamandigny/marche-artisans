import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

function DashboardLayout() {

  const { utilisateur } = useAuth()

  const classe = ({ isActive }) =>
    isActive ? 'dash-link active' : 'dash-link'

  return (
    <div className="dash">

      <aside className="dash-sidebar">

        <p className="dash-sidebar-title">
          {utilisateur?.role === 'admin' ? 'ESPACE ADMIN' : 'ESPACE ARTISAN'}
        </p>

        <NavLink to="/dashboard" end className={classe}>
          📊 Tableau de bord
        </NavLink>

        <NavLink to="/dashboard/produits" className={classe}>
          📦 Mes produits
        </NavLink>

        <NavLink to="/dashboard/commandes" className={classe}>
          🧾 Commandes reçues
        </NavLink>

        <div className="dash-separator" />

        <NavLink to="/" className="dash-link">
          🏠 Retour au site
        </NavLink>

      </aside>

      <main>
        <Outlet />
      </main>

    </div>
  )
}

export default DashboardLayout