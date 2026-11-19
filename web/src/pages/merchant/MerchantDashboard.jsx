import { useEffect, useState } from "react";
import { getOrders } from "../../services/orderService";
import { getOffers } from "../../services/offerService";
import "./merchant.css";

export default function MerchantDashboard() {
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getOffers()])
      .then(([o, f]) => {
        setOrders(o);
        setOffers(f);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>Chargement...</p></div>;

  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter((o) => o.status === "paid").length;
  const pickedUp = orders.filter((o) => o.status === "picked_up");
  const mealsSaved = pickedUp.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  const bars = [
    { label: "À récupérer", value: pending, cls: "bar-warn" },
    { label: "Récupérées", value: pickedUp.length, cls: "bar-ok" },
    { label: "Annulées", value: orders.length - valid.length, cls: "bar-off" },
  ];
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tableau de bord</h1>
      </div>

      <div className="stats">
        <div className="stat-card"><span>Chiffre d'affaires</span><strong>{revenue} DT</strong></div>
        <div className="stat-card"><span>Commandes à récupérer</span><strong>{pending}</strong></div>
        <div className="stat-card"><span>Repas sauvés</span><strong>{mealsSaved}</strong></div>
        <div className="stat-card"><span>Offres actives</span><strong>{offers.length}</strong></div>
      </div>

      <h2>Commandes par statut</h2>
      <div className="bars">
        {bars.map((b) => (
          <div key={b.label} className="bar-row">
            <span className="bar-label">{b.label}</span>
            <div className="bar-track">
              <div className={`bar ${b.cls}`} style={{ width: `${(b.value / max) * 100}%` }} />
            </div>
            <span className="bar-value">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}