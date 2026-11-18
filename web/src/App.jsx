import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import OffersList from "./pages/merchant/OffersList";
import OfferForm from "./pages/merchant/OfferForm";
import Orders from "./pages/merchant/Orders";
import ScanQR from "./pages/merchant/ScanQR";
import MyShop from "./pages/merchant/MyShop";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PendingMerchants from "./pages/admin/PendingMerchants";
import UsersManagement from "./pages/admin/UsersManagement";
import MerchantRegister from "./pages/merchant/MerchantRegister";
const merchantLinks = [
  { to: "/merchant/dashboard", label: "📊 Tableau de bord" },
  { to: "/merchant/offers", label: "🍽️ Mes offres" },
  { to: "/merchant/orders", label: "🧾 Commandes" },
  { to: "/merchant/scan", label: "📷 Scanner QR" },
  { to: "/merchant/shop", label: "🏪 Mon commerce" },
];

const adminLinks = [
  { to: "/admin/dashboard", label: "📊 Tableau de bord" },
  { to: "/admin/merchants", label: "🏪 Commerçants" },
  { to: "/admin/users", label: "👥 Utilisateurs" },
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<h1>Accueil CampusSave</h1>} />
          <Route path="/login" element={<h1>Connexion (à faire par P3)</h1>} />
          <Route path="/register/merchant" element={<MerchantRegister />} />

          <Route
            path="/merchant"
            element={
              <ProtectedRoute role="merchant">
                <Layout title="Espace commerçant" links={merchantLinks} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MerchantDashboard />} />
            <Route path="offers" element={<OffersList />} />
            <Route path="offers/new" element={<OfferForm />} />
            <Route path="offers/:id/edit" element={<OfferForm />} />
            <Route path="orders" element={<Orders />} />
            <Route path="scan" element={<ScanQR />} />
            <Route path="shop" element={<MyShop />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Layout title="Espace administrateur" links={adminLinks} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="merchants" element={<PendingMerchants />} />
            <Route path="users" element={<UsersManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}