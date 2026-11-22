# Collections Firestore (projet `campussave-950cd`)

Toutes les dates sont des chaînes ISO 8601 (`new Date().toISOString()`), les montants sont en TND.
L'ID d'un document `users` est l'**UID Firebase Auth**.
`createdAt` et `lastLoginAt` de `users` sont des **Timestamps Firestore** (comme les documents déjà créés par l'équipe) ; l'API les renvoie en ISO.

## `users`
| Champ | Type | Remarque |
|---|---|---|
| uid, id | string | = UID Auth |
| firstName, lastName | string | format historique de l'équipe |
| name | string | `firstName + lastName` ; si absent, l'API le reconstruit |
| email | string | |
| role | `student` \| `merchant` \| `admin` | aussi copié dans les custom claims Auth |
| active | boolean | `false` = compte désactivé ; absent = actif (anciens documents) |
| phone, university | string | étudiants |
| fcmTokens | string[] | jetons FCM des appareils (jamais renvoyés au client) |
| createdAt, lastLoginAt | Timestamp | |
| updatedAt | string | |

## `shops`
| Champ | Type | Remarque |
|---|---|---|
| ownerId | string | UID du commerçant |
| name, type, address | string | |
| status | `pending` \| `approved` \| `rejected` \| `suspended` | créé en `pending`, validé par l'admin |
| statusReason, reviewedBy | string | renseignés par l'admin |

## `offers`
| Champ | Type | Remarque |
|---|---|---|
| shopId | string | ID du doc `shops` |
| title, category, description | string | |
| originalPrice, discountPrice | number | |
| quantity | number | stock initial |
| pickupStart, pickupEnd | string | `HH:mm` |
| photoUrl | string \| null | |
| active | boolean | |

## `orders`
| Champ | Type | Remarque |
|---|---|---|
| code | string | `CS-1001`, contenu du QR code |
| userId, studentName | string | |
| shopId, shopName, shopAddress | string | |
| items | `{ offerId, title, qty, unitPrice, originalPrice }[]` | un seul commerce par commande |
| total | number | |
| status | `pending` \| `paid` \| `picked_up` \| `cancelled` | `pending` = stock bloqué 10 min |
| expiresAt | string | seulement tant que `pending` |
| pickupStart, pickupEnd | string | |
| createdAt, paidAt, pickedUpAt | string | |

## `payments`
| Champ | Type | Remarque |
|---|---|---|
| orderId, userId | string | |
| amount | number | |
| method | string | `card` |
| last4 | string | **jamais** le numéro complet |
| status | `succeeded` \| `failed` | |
| createdAt | string | |

## Règles de sécurité
Le backend utilise le SDK Admin, qui **ignore** les règles Firestore. Le mode test (ouvert à tous) expire au bout de 30 jours :
avant la démo, remplacer par des règles fermées, le front ne parlant qu'à l'API :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```
