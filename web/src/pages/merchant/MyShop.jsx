import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getShop, saveShop } from "../../services/shopService";
import "./merchant.css";

const STATUS = {
  pending: { label: "En attente de validation", cls: "badge-warn" },
  approved: { label: "Validé", cls: "badge-ok" },
  rejected: { label: "Refusé", cls: "badge-off" },
};

export default function MyShop() {
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    getShop().then((shop) => {
      setStatus(shop.status);
      reset(shop);
    });
  }, [reset]);

  const onSubmit = async (values) => {
    setMessage("");
    setError("");
    try {
      await saveShop(values);
      setMessage("Informations enregistrées.");
    } catch {
      setError("L'enregistrement a échoué.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mon commerce</h1>
        <span className={`badge ${STATUS[status].cls}`}>{STATUS[status].label}</span>
      </div>

      {status === "pending" && (
        <p className="info">
          Votre commerce doit être validé par l'administrateur avant que vos offres soient visibles.
        </p>
      )}
      {message && <p className="success">{message}</p>}
      {error && <p className="alert">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="form" noValidate>
        <div className="field">
          <label htmlFor="name">Nom du commerce *</label>
          <input id="name" {...register("name", { required: "Le nom est obligatoire", minLength: { value: 2, message: "Minimum 2 caractères" } })} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="type">Type *</label>
          <select id="type" {...register("type", { required: "Choisissez un type" })}>
            <option value="">-- Choisir --</option>
            <option>Restaurant</option>
            <option>Cafétéria</option>
            <option>Boulangerie</option>
            <option>Fast-food</option>
          </select>
          {errors.type && <span className="error">{errors.type.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="address">Adresse *</label>
          <input id="address" {...register("address", { required: "L'adresse est obligatoire" })} />
          {errors.address && <span className="error">{errors.address.message}</span>}
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="phone">Téléphone *</label>
            <input
              id="phone"
              {...register("phone", {
                required: "Le téléphone est obligatoire",
                pattern: { value: /^[2-9]\d{7}$/, message: "8 chiffres requis (ex : 71123456)" },
              })}
            />
            {errors.phone && <span className="error">{errors.phone.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="openingHours">Horaires d'ouverture</label>
            <input id="openingHours" {...register("openingHours")} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}