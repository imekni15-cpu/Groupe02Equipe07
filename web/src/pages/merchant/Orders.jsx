import { useEffect, useState } from "react";
import { getOrders, validatePickup } from "../../services/orderService";
import "./merchant.css";

const STATUS = {
  paid: { label: "À récupérer", cls: "badge-warn" },
  picked_up: { label: "Récupérée", cls: "badge-ok" },
  cancelled: { label: "Annulée", cls: "badge-off" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setError("Impossible de charger les commandes."))
      .finally(() => setLoading(false));
  }, []);

  const handlePickup = async (order) => {
    try {
      const updated = await validatePickup(order.code);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (e) {
      setError(e.message);
    }
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Commandes</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter">
          <option value="all">Toutes</option>
          <option value="paid">À récupérer</option>
          <option value="picked_up">Récupérées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {error && <p className="alert">{error}</p>}
      {loading && <p>Chargement...</p>}
      {!loading && shown.length === 0 && <p className="empty">Aucune commande.</p>}

      {!loading && shown.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Étudiant</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id}>
                <td data-label="Code"><strong>{o.code}</strong></td>
                <td data-label="Étudiant">{o.studentName}</td>
                <td data-label="Articles">
                  {o.items.map((i) => `${i.qty} × ${i.title}`).join(", ")}
                </td>
                <td data-label="Total">{o.total} DT</td>
                <td data-label="Date">{new Date(o.createdAt).toLocaleString("fr-FR")}</td>
                <td data-label="Statut">
                  <span className={`badge ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span>
                </td>
                <td data-label="Action">
                  {o.status === "paid" && (
                    <button onClick={() => handlePickup(o)} className="btn btn-primary">
                      Valider le retrait
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}