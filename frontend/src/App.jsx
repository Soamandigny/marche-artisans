import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import './styles/responsive.css'

import { AuthProvider } from './context/AuthContext'
import { PanierProvider } from './context/PanierContext'
import { ToastProvider } from './context/ToastContext'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Accueil from './pages/Accueil'
import Produits from './pages/Produits'
import ProduitDetail from './pages/ProduitDetail'
import Connexion from './pages/Connexion'
import AccesRefuse from './pages/AccesRefuse'
import NotFound from './pages/NotFound'
import DashboardArtisan from './pages/DashboardArtisan'
import MesProduits from './pages/MesProduits'
import ProduitForm from './pages/ProduitForm'
import CommandesRecues from './pages/CommandesRecues'
import AdminStatistiques from './pages/AdminStatistiques'
import AdminCommandes from './pages/AdminCommandes'
import AdminUtilisateurs from './pages/AdminUtilisateurs'
import AdminCategories from './pages/AdminCategories'
import MesCommandes from './pages/MesCommandes'
import Panier from './pages/Panier'
import Commander from './pages/Commander'
import PayerCommande from './pages/PayerCommande'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PanierProvider>
          <ToastProvider>

            <Routes>

              <Route element={<MainLayout />}>

                {/* Seule page accessible sans compte */}
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/acces-refuse" element={<AccesRefuse />} />

                {/* Catalogue : connexion obligatoire (tous les rôles) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/produits" element={<Produits />} />
                  <Route path="/produits/:id" element={<ProduitDetail />} />
                </Route>

                {/* Espace artisan : avec sidebar */}
                <Route element={<ProtectedRoute roles={['artisan', 'admin']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardArtisan />} />
                    <Route path="/dashboard/produits" element={<MesProduits />} />
                    <Route path="/dashboard/produits/nouveau" element={<ProduitForm />} />
                    <Route path="/dashboard/produits/:id/modifier" element={<ProduitForm />} />
                    <Route path="/dashboard/commandes" element={<CommandesRecues />} />
                  </Route>
                </Route>

                {/* Espace administrateur : admin uniquement */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Navigate to="/admin/statistiques" replace />} />
                    <Route path="/admin/statistiques" element={<AdminStatistiques />} />
                    <Route path="/admin/commandes" element={<AdminCommandes />} />
                    <Route path="/admin/utilisateurs" element={<AdminUtilisateurs />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                  </Route>
                </Route>

                {/* Réservé aux clients */}
                <Route element={<ProtectedRoute roles={['client']} />}>
                  <Route path="/panier" element={<Panier />} />
                  <Route path="/commander" element={<Commander />} />
                  <Route path="/mes-commandes" element={<MesCommandes />} />
                  <Route path="/payer/:id" element={<PayerCommande />} />
                </Route>

                {/* Toute autre adresse */}
                <Route path="*" element={<NotFound />} />

              </Route>

            </Routes>

          </ToastProvider>
        </PanierProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App