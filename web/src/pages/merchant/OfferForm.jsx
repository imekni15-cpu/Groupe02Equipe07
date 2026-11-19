import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getOffer, createOffer, updateOffer } from "../../services/offerService";
import "./merchant.css";

const CATEGORIES = ["Sandwich", "Plat chaud", "Salade", "Pâtisserie", "Boisson", "Autre"];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 Mo

export default function OfferForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [existingPhoto, setExistingPhoto] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      category: "",
      description: "",
      originalPrice: "",
      discountPrice: "",
      quantity: 1,
      pickupStart: "",
      pickupEnd: "",
    },
  });

  // Mode modification : charger l'offre existante
  useEffect(() => {
    if (!isEdit) return;
    getOffer(id).then((offer) => {
      if (!offer) {
        navigate("/merchant/offers");
        return;
      }
      setExistingPhoto(offer.photoUrl || "");
      reset(offer);
    });
  }, [id, isEdit, reset, navigate]);

  // Aperçu de la nouvelle photo
  const photoFiles = watch("photo");
  const previewUrl =
    photoFiles && photoFiles[0] ? URL.createObjectURL(photoFiles[0]) : existingPhoto;

  const onSubmit = async (values) => {
    setServerError("");
    const payload = {
      ...values,
      photo: values.photo && values.photo[0] ? values.photo[0] : undefined,
    };
    try {
      if (isEdit) await updateOffer(id, payload);
      else await createOffer(payload);
      navigate("/merchant/offers");
    } catch {
      setServerError("L'enregistrement a échoué. Réessayez.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? "Modifier l'offre" : "Nouvelle offre"}</h1>
        <Link to="/merchant/offers" className="btn btn-light">
          ← Retour
        </Link>
      </div>

      {serverError && <p className="alert">{serverError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="form" noValidate>
        <div className="field">
          <label htmlFor="title">Titre *</label>
          <input
            id="title"
            {...register("title", {
              required: "Le titre est obligatoire",
              minLength: { value: 3, message: "Minimum 3 caractères" },
              maxLength: { value: 80, message: "Maximum 80 caractères" },
            })}
          />
          {errors.title && <span className="error">{errors.title.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="category">Catégorie *</label>
          <select
            id="category"
            {...register("category", { required: "Choisissez une catégorie" })}
          >
            <option value="">-- Choisir --</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <span className="error">{errors.category.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows="3"
            {...register("description", {
              maxLength: { value: 300, message: "Maximum 300 caractères" },
            })}
          />
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="originalPrice">Prix initial (DT) *</label>
            <input
              id="originalPrice"
              type="number"
              step="0.1"
              {...register("originalPrice", {
                required: "Le prix initial est obligatoire",
                valueAsNumber: true,
                min: { value: 0.1, message: "Le prix doit être positif" },
              })}
            />
            {errors.originalPrice && (
              <span className="error">{errors.originalPrice.message}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="discountPrice">Prix réduit (DT) *</label>
            <input
              id="discountPrice"
              type="number"
              step="0.1"
              {...register("discountPrice", {
                required: "Le prix réduit est obligatoire",
                valueAsNumber: true,
                min: { value: 0.1, message: "Le prix doit être positif" },
                validate: (v) =>
                  v < Number(getValues("originalPrice")) ||
                  "Le prix réduit doit être inférieur au prix initial",
              })}
            />
            {errors.discountPrice && (
              <span className="error">{errors.discountPrice.message}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="quantity">Quantité *</label>
            <input
              id="quantity"
              type="number"
              {...register("quantity", {
                required: "La quantité est obligatoire",
                valueAsNumber: true,
                min: { value: 1, message: "Minimum 1" },
                validate: (v) => Number.isInteger(v) || "Nombre entier requis",
              })}
            />
            {errors.quantity && <span className="error">{errors.quantity.message}</span>}
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="pickupStart">Début de récupération *</label>
            <input
              id="pickupStart"
              type="time"
              {...register("pickupStart", { required: "L'heure de début est obligatoire" })}
            />
            {errors.pickupStart && <span className="error">{errors.pickupStart.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="pickupEnd">Fin de récupération *</label>
            <input
              id="pickupEnd"
              type="time"
              {...register("pickupEnd", {
                required: "L'heure de fin est obligatoire",
                validate: (v) =>
                  v > getValues("pickupStart") ||
                  "L'heure de fin doit être après l'heure de début",
              })}
            />
            {errors.pickupEnd && <span className="error">{errors.pickupEnd.message}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="photo">Photo (image, 2 Mo maximum)</label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            {...register("photo", {
              validate: (files) => {
                if (!files || files.length === 0) return true;
                const file = files[0];
                if (!file.type.startsWith("image/")) return "Le fichier doit être une image";
                if (file.size > MAX_PHOTO_SIZE) return "La photo dépasse 2 Mo";
                return true;
              },
            })}
          />
          {errors.photo && <span className="error">{errors.photo.message}</span>}
          {previewUrl && !errors.photo && (
            <img src={previewUrl} alt="Aperçu" className="preview" />
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Publier l'offre"}
        </button>
      </form>
    </div>
  );
}