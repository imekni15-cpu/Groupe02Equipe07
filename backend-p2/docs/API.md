# CampusSave Personne 2 – API

Toutes les routes métier utilisent `Authorization: Bearer <Firebase ID token>`.

## Shops
### GET `/api/shops/mine`
Retourne `id, name, type, address, phone, openingHours, status`.

### PUT `/api/shops/mine`
JSON :
```json
{
  "name": "Ma boutique",
  "type": "Cafétéria",
  "address": "Tunis",
  "phone": "12345678",
  "openingHours": "08:00-18:00"
}
```
Le statut est volontairement exclu des champs modifiables.

## Offers
### GET `/api/offers/mine`
Liste les offres du commerçant connecté.

### GET `/api/offers/:id`
Retourne une offre uniquement si elle appartient à la boutique du commerçant.

### POST `/api/offers`
`multipart/form-data`, champs : `title`, `category`, `description`, `originalPrice`, `discountPrice`, `quantity`, `pickupStart`, `pickupEnd`, `photo`.

### PUT `/api/offers/:id`
Même champs. `photo` est facultative ; sans nouvelle photo, l'ancienne est conservée.

### DELETE `/api/offers/:id`
Supprime une offre appartenant au commerçant.

## Orders
### GET `/api/orders/mine`
Retourne uniquement les commandes payées associées à la boutique.

### POST `/api/orders/validate`
JSON :
```json
{ "code": "CS-1001" }
```
Le code est normalisé sans espaces et sans distinction majuscules/minuscules. La validation vérifie l'appartenance à la boutique, le paiement et l'état de retrait, puis passe le statut à `picked_up`.

## Statistics
### GET `/api/stats/merchant`
Retourne :
```json
{
  "totalOrders": 0,
  "completedOrders": 0,
  "revenue": 0
}
```
