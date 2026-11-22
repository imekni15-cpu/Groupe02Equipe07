# CampusSave – Backend Personne 2

Backend API indépendant pour la partie commerçant : boutiques, offres, commandes, validation de retrait et statistiques.

## Technologies
- Node.js / Express
- MySQL
- Firebase Admin Authentication
- Multer pour les photos

## 1. Préparation

1. Installer Node.js LTS et MySQL.
2. Créer la base et les tables en exécutant `database/schema.sql` dans MySQL Workbench ou le client MySQL.
3. Copier `.env.example` vers `.env` puis renseigner les paramètres MySQL.
4. Placer le fichier de service account Firebase dans le dossier `backend` sous le nom `serviceAccountKey.json`, ou configurer `FIREBASE_SERVICE_ACCOUNT_PATH`.
5. Ne jamais envoyer `.env` ou `serviceAccountKey.json` sur GitHub.

## 2. Installation et démarrage

```bash
npm install
npm run dev
```

L'API démarre par défaut sur `http://localhost:5000`.
Tester `GET /api/health`.

## 3. Authentification

Les routes Personne 2 attendent un Firebase ID token :

`Authorization: Bearer FIREBASE_ID_TOKEN`

Le frontend doit obtenir le token depuis Firebase Authentication et l'envoyer dans cet en-tête.

## 4. Routes

Base URL : `http://localhost:5000/api`

| Méthode | Route | Description |
|---|---|---|
| GET | `/shops/mine` | Profil de la boutique |
| PUT | `/shops/mine` | Modifier le profil (le statut ne peut pas être modifié) |
| GET | `/offers/mine` | Mes offres |
| GET | `/offers/:id` | Détail d'une offre appartenant au commerçant |
| POST | `/offers` | Créer une offre (multipart/form-data, champ photo) |
| PUT | `/offers/:id` | Modifier une offre (photo facultative) |
| DELETE | `/offers/:id` | Supprimer une offre |
| GET | `/orders/mine` | Commandes payées de la boutique |
| POST | `/orders/validate` | Valider le code de retrait |
| GET | `/stats/merchant` | Statistiques commerçant |

## 5. Format de création d'offre

`multipart/form-data` :
- `title`
- `category`
- `description`
- `originalPrice`
- `discountPrice`
- `quantity`
- `pickupStart` (date/heure ISO ou MySQL DATETIME)
- `pickupEnd`
- `photo` (image JPEG, PNG ou WEBP, maximum 2 MB)

Catégories acceptées : Sandwich, Plat chaud, Salade, Pâtisserie, Boisson, Autre.

## 6. Important – intégration avec le reste de l'équipe

- Ce ZIP est un backend autonome de référence, pas une modification automatique du dépôt partagé.
- Le schéma SQL fourni est prévu pour une base propre. Ne l'exécutez pas directement sur une base existante contenant déjà des tables `shops`, `offers` ou `orders` sans comparer les colonnes.
- La création des commandes étudiantes et le paiement ne sont pas inclus : le contrat Personne 2 fourni ne définit pas complètement ces flux. Les commandes doivent être créées par le module étudiant/paiement de l'équipe et enregistrées dans `orders` + `order_items`.
- Konnect et FCM ne sont pas simulés : il faut les spécifications et identifiants fournis par l'équipe avant de les intégrer.
- Le middleware vérifie Firebase ID tokens et vérifie qu'un compte possède une boutique. Il ne remplace pas la logique d'approbation du commerçant par l'administrateur.
- Testez les endpoints avec un vrai token Firebase et une boutique associée à son UID avant de connecter le frontend.

## 7. Réponses d'erreur
Les erreurs API utilisent généralement `{ "message": "..." }` avec les codes HTTP 400, 401, 403, 404 et 409.
