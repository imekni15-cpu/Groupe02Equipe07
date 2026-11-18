import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { validatePickup } from "../../services/orderService";
import "./merchant.css";

export default function ScanQR() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const stopScan = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* déjà arrêté */
      }
    }
    setScanning(false);
  };

  // Couper la caméra quand on quitte la page
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  const submitCode = async (value) => {
    setResult(null);
    setError("");
    if (!value.trim()) {
      setError("Saisissez ou scannez le code de la commande.");
      return;
    }
    setLoading(true);
    try {
      setResult(await validatePickup(value));
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    setResult(null);
    setError("");
    setScanning(true);
    await new Promise((r) => setTimeout(r, 50)); // laisser le bloc vidéo s'afficher
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => {
          await stopScan();
          await submitCode(text);
        },
        () => {}
      );
    } catch {
      scannerRef.current = null;
      setScanning(false);
      setError("Caméra inaccessible. Autorisez la caméra dans le navigateur ou saisissez le code.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitCode(code);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Valider une commande</h1>
      </div>

      <div className="scan-box">
        <div id="qr-reader" className="qr-reader" style={{ display: scanning ? "block" : "none" }} />
        {!scanning ? (
          <button onClick={startScan} className="btn btn-primary">📷 Scanner un QR code</button>
        ) : (
          <button onClick={stopScan} className="btn btn-light">Arrêter la caméra</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="form" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="code">Ou saisir le code (affiché sous le QR)</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CS-1001"
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