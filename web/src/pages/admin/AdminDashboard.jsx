import { useEffect, useState } from "react";
import { getAdminStats, getShops, getUsers } from "../../services/adminService";
import "../merchant/merchant.css";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAdminStats(), getShops(), getUsers()])
      .then(([stats, shops, users]) => setData({ stats, shops, users }))
      .catch(() => setError("Impossible de charger les statistiques."));
  }, []);

  if (error) return <div className="page"><p className="alert">{error}</p></div>;
  if (!data) return <div className="page"><p>Chargement...</p></div>;

  const { stats, shops, users } = data;
  const students = users.filter((u) => u.role === "student").length;
  const merchants = users.filter((u) => u.role === "merchant").length;
  const pending = shops.filter((s) => s.status === "pending").length;
  const max = Math.max(1, ...stats.weekly.map((d) => d.value));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tableau de bord administrateur</h1>
      </div>

      <div className="stats">
        <div className="stat-card"><span>Étudiants inscrits</span><strong>{students}</strong></div>
        <div className="stat-card"><span>Commerçants</span><strong>{merchants}</strong></div>
        <div className="stat-card"><span>Commerces à valider</span><strong>{pending}</strong></div>
        <div className="stat-card"><span>Commandes totales</span><strong>{stats.orders}</strong></div>
        <div className="stat-card"><span>Chiffre d'affaires</span><strong>{stats.revenue} DT</strong></div>
        <div className="stat-card"><span>Repas sauvés</span><strong>{stats.mealsSaved}</strong></div>
      </div>

      <h2>Commandes de la semaine</h2>
      <div className="chart">
        {stats.weekly.map((d) => (
          <div key={d.label} className="chart-col">
            <span className="chart-value">{d.value}</span>
            <div className="chart-bar" style={{ height: `${(d.value / max) * 140}px` }} />
            <span className="chart-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}