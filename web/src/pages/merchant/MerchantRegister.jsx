import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { registerUser } from "../../services/authService";
import "./merchant.css";

export default function MerchantRegister() {
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: "merchant",
      });
      setDone(true);
    } catch (e) {
      setServerError(e.message);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Compte créé ✅</h1>
          <p className="info">
            Votre compte commerçant est en attente de validation par l'administrateur.
            Connectez-vous, puis complétez les informations de votre commerce dans
            « Mon commerce ».
          </p>
          <Link to="/login" className="btn btn-primary">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🌱 Inscription commerçant</h1>
        <p className="muted">Proposez vos invendus aux étudiants de l'ESSECT.</p>

        {serverError && <p className="alert">{serverError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="form-plain" noValidate>
          <div className="field">
            <label htmlFor="name">Nom du responsable *</label>
            <input
              id="name"
              {...register("name", {
                required: "Le nom est obligatoire",
                minLength: { value: 2, message: "Minimum 2 caractères" },
              })}
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "L'email est obligatoire",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Email invalide" },
              })}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe *</label>
            <input
              id="password"
              type="password"
              {...register("password", {
                required: "Le mot de passe est obligatoire",
                minLength: { value: 6, message: "Minimum 6 caractères" },
              })}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirmer le mot de passe *</label>
            <input
              id="confirm"
              type="password"
              {...register("confirm", {
                required: "Confirmez le mot de passe",
                validate: (v) => v === getValues("password") || "Les mots de passe ne correspondent pas",
              })}
            />
            {errors.confirm && <span className="error">{errors.confirm.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="muted">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}