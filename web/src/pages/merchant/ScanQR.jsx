import { useState } from "react";
import { validatePickup } from "../../services/orderService";
import "./merchant.css";

export default function ScanQR() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError("");
    if (!code.trim()) {
      setError("Saisissez le code de la commande.");
      return;
    }
    setLoading(true);
    try {
      setResult(await validatePickup(code));
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Valider une commande</h1>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label htmlFor="code">Code de la commande (affiché sous le QR)</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CS-1001"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Vérification..." : "Valider le retrait"}
        </button>
      </form>

      {error && <p className="alert" style={{ marginTop: 16 }}>❌ {error}</p>}
      {result && (
        <div className="success" style={{ marginTop: 16 }}>
          ✅ Commande <strong>{result.code}</strong> validée pour {result.studentName} :{" "}
          {result.items.map((i) => `${i.qty} × ${i.title}`).join(", ")}
        </div>
      )}
    </div>
  );
}