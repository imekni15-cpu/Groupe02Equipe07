import { useEffect, useState } from "react";
import { getUsers, setUserActive } from "../../services/adminService";
import "../merchant/merchant.css";

const ROLES = { student: "Étudiant", merchant: "Commerçant", admin: "Administrateur" };

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError("Impossible de charger les utilisateurs."))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (user) => {
    try {
      const updated = await setUserActive(user.id, !user.active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setError("L'opération a échoué.");
    }
  };

  const term = search.trim().toLowerCase();
  const shown = users.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Utilisateurs</h1>
      </div>

      <div className="toolbar">
        <input
          className="filter search"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="filter">
          <option value="all">Tous les rôles</option>
          <option value="student">Étudiants</option>
          <option value="merchant">Commerçants</option>
          <option value="admin">Administrateurs</option>
        </select>
      </div>

      {error && <p className="alert">{error}</p>}
      {loading && <p>Chargement...</p>}
      {!loading && shown.length === 0 && <p className="empty">Aucun utilisateur trouvé.</p>}

      {!loading && shown.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td data-label="Nom"><strong>{u.name}</strong></td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Rôle">{ROLES[u.role]}</td>
                <td data-label="Statut">
                  <span className={`badge ${u.active ? "badge-ok" : "badge-off"}`}>
                    {u.active ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td data-label="Action">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => handleToggle(u)}
                      className={u.active ? "btn btn-danger" : "btn btn-primary"}
                    >
                      {u.active ? "Désactiver" : "Réactiver"}
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