# CampusSave : contrat d'API (v1)

Rédigé par P4 (React commerçant/admin) à partir de ce que le front attend déjà.
Destinataires : P1 (auth, admin) et P2 (commerces, offres, commandes, stats).

## Conventions générales

- **Base URL** : `http://localhost:5000/api` (variable `VITE_API_URL` côté front)
- **Format** : JSON, sauf création/modification d'offre (`multipart/form-data`)
- **Authentification** : header `Authorization: Bearer <token>` (token Firebase ou JWT)
- **Rôles** : `student`, `merchant`, `admin`
- **Dates** : ISO 8601 (`2026-11-17T12:10:00`)
- **Prix** : nombres en dinars (DT)
- **Erreurs** : réponse `{ "message": "texte lisible" }` avec le code HTTP adapté
  - `400` données invalides, `401` non connecté, `403` rôle interdit, `404` introuvable, `409` conflit

---

## 1. Authentification (P1)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Inscription |
| POST | `/auth/login` | public | Connexion |
| GET | `/auth/me` | connecté | Profil courant |

**POST `/auth/register`**
```json
{ "name": "Mohamed A.", "email": "m@cafe.tn", "password": "******", "role": "merchant" }
```
Un compte `merchant` est créé avec un commerce au statut `pending`. Le rôle `admin` ne peut pas être demandé à l'inscription.

**POST `/auth/login`** → `200`
```json
{
  "token": "xxxxx",
  "user": { "id": "u4", "name": "Mohamed Azizi", "email": "m@cafe.tn", "role": "merchant" }
}
```
Le front stocke `user` et `token`. Un compte désactivé (`active: false`) reçoit `403`.

---

## 2. Offres (P2), rôle `merchant`

| Méthode | Route | Description |
|---|---|---|
| GET | `/offers/mine` | Offres du commerçant connecté |
| GET | `/offers/:id` | Détail d'une offre |
| POST | `/offers` | Création (multipart) |
| PUT | `/offers/:id` | Modification (multipart) |
| DELETE | `/offers/:id` | Suppression |

**Objet Offre**
```json
{
  "id": "1",
  "title": "Panier sandwichs",
  "category": "Sandwich",
  "description": "3 sandwichs variés du jour",
  "originalPrice": 12,
  "discountPrice": 5,
  "quantity": 6,
  "pickupStart": "17:00",
  "pickupEnd": "18:30",
  "photoUrl": "https://.../photo.jpg"
}
```

**Champs envoyés en multipart (POST et PUT)** : `title`, `category`, `description`, `originalPrice`, `discountPrice`, `quantity`, `pickupStart`, `pickupEnd`, et `photo` (fichier optionnel).

Points d'attention pour P2 :
- En multipart, **tous les champs arrivent en texte** : convertir les nombres côté serveur.
- Catégories : `Sandwich`, `Plat chaud`, `Salade`, `Pâtisserie`, `Boisson`, `Autre`.
- Validation serveur (en plus du front) : `discountPrice < originalPrice`, `quantity >= 1` entier, `pickupEnd > pickupStart`, photo de type image et 2 Mo maximum.
- PUT sans `photo` : conserver l'ancienne photo.
- Une offre n'est visible des étudiants que si le commerce est `approved`.
- `GET /offers/:id` et `PUT`/`DELETE` : `403` si l'offre n'appartient pas au commerçant.
- Réponse : POST renvoie `201` + l'offre, PUT et DELETE renvoient `200` ou `204`.

---

## 3. Commandes (P2)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/orders/mine` | merchant | Commandes reçues par le commerce |
| POST | `/orders/validate` | merchant | Valide le retrait via le code du QR |

**Objet Commande**
```json
{
  "id": "o1",
  "code": "CS-1001",
  "studentName": "Amine B.",
  "items": [{ "title": "Panier sandwichs", "qty": 2 }],
  "total": 10,
  "status": "paid",
  "createdAt": "2026-11-17T12:10:00"
}
```

**Statuts** : `paid` (à récupérer), `picked_up` (récupérée), `cancelled` (annulée).
Les commandes non payées n'apparaissent pas côté commerçant.

**POST `/orders/validate`**
```json
{ "code": "CS-1001" }
```
- `200` : renvoie la commande mise à jour (`status: "picked_up"`)
- `404` : `{ "message": "Code inconnu." }`
- `409` : `{ "message": "Cette commande a déjà été récupérée." }`
- `400` : `{ "message": "Cette commande n'est pas payée." }`
- `403` : la commande appartient à un autre commerce

Le champ `message` est affiché tel quel au commerçant. Le `code` est le texte encodé dans le QR code (sans espace, insensible à la casse).

---

## 4. Mon commerce (P2), rôle `merchant`

| Méthode | Route | Description |
|---|---|---|
| GET | `/shops/mine` | Commerce du commerçant connecté |
| PUT | `/shops/mine` | Modification des informations |

**Objet Commerce (vue commerçant)**
```json
{
  "name": "Café Campus",
  "type": "Cafétéria",
  "address": "Avenue de l'Université, Tunis",
  "phone": "71123456",
  "openingHours": "08:00 - 19:00",
  "status": "pending"
}
```
- `type` : `Restaurant`, `Cafétéria`, `Boulangerie`, `Fast-food`
- `phone` : 8 chiffres
- `status` : `pending`, `approved`, `rejected`. **Non modifiable** par le commerçant : à ignorer dans le PUT.

---

## 5. Administration (P1), rôle `admin`

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/shops` | Tous les commerces |
| PATCH | `/admin/shops/:id/status` | Valider ou refuser un commerce |
| GET | `/admin/users` | Tous les utilisateurs |
| PATCH | `/admin/users/:id` | Activer ou désactiver un compte |
| GET | `/admin/stats` | Statistiques globales |

**Objet Commerce (vue admin)**
```json
{
  "id": "s1", "name": "Café Campus", "type": "Cafétéria",
  "owner": "Mohamed A.", "address": "Avenue de l'Université, Tunis",
  "status": "pending", "createdAt": "2026-11-15"
}
```

**PATCH `/admin/shops/:id/status`**
```json
{ "status": "approved" }
```
Valeurs acceptées : `approved`, `rejected`. Renvoie le commerce mis à jour.

**Objet Utilisateur**
```json
{ "id": "u1", "name": "Amine Ben Salah", "email": "amine@essect.tn", "role": "student", "active": true }
```

**PATCH `/admin/users/:id`**
```json
{ "active": false }
```
Renvoie l'utilisateur mis à jour. Interdit sur un compte `admin` (`403`). Un compte désactivé ne peut plus se connecter.

**GET `/admin/stats`**
```json
{
  "orders": 148,
  "revenue": 612,
  "mealsSaved": 231,
  "weekly": [
    { "label": "Lun", "value": 18 },
    { "label": "Mar", "value": 25 }
  ]
}
```
`weekly` : 7 entrées (Lun à Dim) avec le nombre de commandes de la semaine courante.
`revenue` et `mealsSaved` ne comptent que les commandes `paid` et `picked_up` (`mealsSaved` : somme des quantités récupérées).

---

## 6. Points à décider ensemble

1. **Token** : Firebase ID token ou JWT maison ? Le front envoie dans les deux cas `Bearer <token>`.
2. **CORS** : autoriser `http://localhost:5173` (React) côté Express.
3. **Stats commerçant** : aujourd'hui le tableau de bord commerçant calcule ses chiffres à partir de `/orders/mine` et `/offers/mine`. Si P2 préfère, il peut fournir `GET /merchant/stats` (même résultat, calculé côté serveur).
4. **Pagination** : non prévue en v1 (listes courtes). À ajouter si besoin.
5. **Identifiants** : les `id` sont des chaînes (ids Firestore).

## 7. Passage du mock à l'API réelle

Dans le front, chaque service (`offerService`, `orderService`, `shopService`, `adminService`) a une constante `USE_MOCK`. Quand les routes ci-dessus sont disponibles, elle passe à `false`. Tout écart avec ce contrat doit être signalé à P4 avant modification.
