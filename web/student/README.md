# CampusSave : interface étudiant (Personne 3)

React 18 + Vite, React Router 6, Axios, Zustand, QR code (`qrcode.react`).

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:5173
```

Aucun serveur n'est nécessaire : par défaut l'application utilise une **API simulée** (`VITE_USE_MOCK=true`, données dans `localStorage`).

### Comptes de démonstration (mot de passe : `Campus123`)

| Rôle | Email | Effet |
|---|---|---|
| Étudiant | `amine@essect.tn` | Accès complet, 8 commandes d'historique + 1 QR code actif |
| Commerçant | `m@cafe.tn` | Redirigé vers `/merchant` (espace P4) : démontre la protection par rôle |
| Admin | `admin@campussave.tn` | Redirigé vers `/admin` |

Carte de test pour le paiement : `4242 4242 4242 4242` (date future, CVC à 3 chiffres). La carte `4000 0000 0000 0002` simule un refus.
Sur la page d'une commande payée, le bouton « Démo : simuler le scan du commerçant » passe la commande à « Récupérée ».

## Brancher le vrai back-end

Copier `.env.example` en `.env`, puis :

```
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK=false
```

Le token est envoyé en `Authorization: Bearer <token>` (intercepteur Axios, `src/api/http.js`). Une réponse `401` déconnecte l'utilisateur. Le champ `message` des erreurs est affiché tel quel.

## Correspondance avec le cahier des charges (Personne 3)

| Exigence | Où |
|---|---|
| Routing, structure, Axios, état, routes protégées par rôle | `App.jsx`, `components/Guards.jsx`, `api/http.js`, `store.js` |
| Inscription, connexion, profil + validation | `pages/Register.jsx`, `Login.jsx`, `Profile.jsx`, `utils/validators.js`, `hooks.js` |
| Liste des offres, recherche, filtres | `pages/Offers.jsx` (texte, catégorie, type de commerce, prix max, tri, stock) |
| Panier, réservation, suivi des commandes | `pages/Cart.jsx` (réservation 10 min), `Orders.jsx` (rafraîchi toutes les 10 s) |
| Paiement + QR code | `pages/Pay.jsx` (carte, Luhn, compte à rebours), `OrderDetail.jsx` (QR = `code`, comme le contrat) |
| Tableau de bord étudiant | `pages/Dashboard.jsx` |
| Responsive | `styles.css` (barre d'onglets mobile, grilles fluides) |

## Endpoints utilisés par le front étudiant

Déjà dans le contrat v1 : `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.

**À valider avec P1 / P2** (absents du contrat v1) :

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| PUT | `/auth/me` | student | `{ name, phone, university }` → utilisateur |
| PUT | `/auth/password` | connecté | `{ currentPassword, newPassword }` |
| GET | `/offers` | student | Offres des commerces `approved`, `quantity` = stock restant. Ajouter `shopId`, `shopName`, `shopType`, `shopAddress` |
| POST | `/orders` | student | `{ items: [{ offerId, qty }] }` → `201` commande `pending` (stock bloqué 10 min, `expiresAt`). `409` si stock insuffisant |
| GET | `/orders/mine` | student | Même route que le commerçant, filtrée selon le rôle |
| GET | `/orders/:id` | student | `403/404` si la commande n'est pas la sienne |
| POST | `/orders/:id/pay` | student | Passe la commande à `paid` |
| POST | `/orders/:id/cancel` | student | Annule une commande `pending` |

Champs ajoutés à l'objet Commande côté étudiant : statut `pending`, `shopName`, `shopAddress`, `pickupStart`, `pickupEnd`, `expiresAt`, et pour chaque ligne `offerId`, `unitPrice`, `originalPrice`.

Le paiement est simulé. En production, passer par une passerelle (Stripe, Konnect, Flouci…) : le front enverrait un jeton, jamais le numéro de carte.
