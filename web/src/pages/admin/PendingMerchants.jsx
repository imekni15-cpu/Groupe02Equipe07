import { useEffect, useState } from "react";
import { getShops, updateShopStatus } from "../../services/adminService";
import "../merchant/merchant.css";

const STATUS = {
  pending: { label: "En attente", cls: "badge-warn" },
  approved: { label: "Validé", cls: "badge-ok" },
  rejected: { label: "Refusé", cls: "badge-off" },
};

export default function PendingMerchants() {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getShops()
      .then(setShops)
      .catch(() => setError("Impossible de charger les commerces."))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (shop, status) => {
    const action = status === "approved" ? "valider" : "refuser";
    if (!window.confirm(`Voulez-vous ${action} « ${shop.name} » ?`)) return;
    try {
      const updated = await updateShopStatus(shop.id, status);
      setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      setError("L'opération a échoué.");
    }
  };

  const shown = filter === "all" ? shops : shops.filter((s) => s.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Validation des commerçants</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter">
          <option value="pending">En attente</option>
          <option value="approved">Validés</option>
          <option value="rejected">Refusés</option>
          <option value="all">Tous</option>
        </select>
      </div>

      {error && <p className="alert">{error}</p>}
      {loading && <p>Chargement...</p>}
      {!loading && shown.length === 0 && <p className="empty">Aucun commerce dans cette catégorie.</p>}

      {!loading && shown.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Commerce</th>
              <th>Type</th>
              <th>Responsable</th>
              <th>Adresse</th>
              <th>Inscrit le</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td data-label="Commerce"><strong>{s.name}</strong></td>
                <td data-label="Type">{s.type}</td>
                <td data-label="Responsable">{s.owner}</td>
                <td data-label="Adresse">{s.address}</td>
                <td data-label="Inscrit le">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
                <td data-label="Statut">
                  <span className={`badge ${STATUS[s.status].cls}`}>{STATUS[s.status].label}</span>
                </td>
                <td data-label="Actions" className="actions">
                  {s.status !== "approved" && (
                    <button onClick={() => handleUpdate(s, "approved")} className="btn btn-primary">
                      Valider
                    </button>
                  )}
                  {s.status !== "rejected" && (
                    <button onClick={() => handleUpdate(s, "rejected")} className="btn btn-danger">
                      Refuser
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