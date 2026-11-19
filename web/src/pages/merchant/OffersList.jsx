import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOffers, deleteOffer } from "../../services/offerService";
import "./merchant.css";

export default function OffersList() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOffers()
      .then(setOffers)
      .catch(() => setError("Impossible de charger les offres."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (offer) => {
    if (!window.confirm(`Supprimer l'offre « ${offer.title} » ?`)) return;
    try {
      await deleteOffer(offer.id);
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch {
      setError("La suppression a échoué.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mes offres</h1>
        <Link to="/merchant/offers/new" className="btn btn-primary">
          + Nouvelle offre
        </Link>
      </div>

      {error && <p className="alert">{error}</p>}
      {loading && <p>Chargement...</p>}

      {!loading && offers.length === 0 && (
        <p className="empty">Aucune offre pour le moment. Publiez votre première offre !</p>
      )}

      {!loading && offers.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Qté</th>
              <th>Récupération</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td data-label="Photo">
                  {o.photoUrl ? (
                    <img src={o.photoUrl} alt={o.title} className="thumb" />
                  ) : (
                    <div className="thumb thumb-empty">🍽️</div>
                  )}
                </td>
                <td data-label="Titre">{o.title}</td>
                <td data-label="Catégorie">{o.category}</td>
                <td data-label="Prix">
                  <s className="old-price">{o.originalPrice} DT</s>{" "}
                  <strong>{o.discountPrice} DT</strong>
                </td>
                <td data-label="Qté">{o.quantity}</td>
                <td data-label="Récupération">
                  {o.pickupStart} - {o.pickupEnd}
                </td>
                <td data-label="Actions" className="actions">
                  <Link to={`/merchant/offers/${o.id}/edit`} className="btn btn-light">
                    Modifier
                  </Link>
                  <button onClick={() => handleDelete(o)} className="btn btn-danger">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}