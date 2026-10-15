import { NavLink, Outlet } from 'react-router-dom'
import '../styles/dashboard.css'

function AdminLayout() {

  const classe = ({ isActive }) =>
    isActive ? 'dash-link active' : 'dash-link'

  return (
    <div className="dash">

      <aside className="dash-sidebar">

        <p className="dash-sidebar-title">
          ESPACE ADMIN
        </p>

        <NavLink to="/admin/statistiques" className={classe}>
          📈 Statistiques
        </NavLink>

        <NavLink to="/admin/commandes" className={classe}>
          🧾 Toutes les commandes
        </NavLink>

        <NavLink to="/admin/utilisateurs" className={classe}>
          👥 Utilisateurs
        </NavLink>

        <NavLink to="/admin/categories" className={classe}>
          🏷️ Catégories
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

export default AdminLayout