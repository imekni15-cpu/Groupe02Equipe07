# CampusSave : application Web (React)

## Installation
npm install

## Configuration
Copier `.env.example` en `.env` et adapter `VITE_API_URL`.

## Lancement
npm run dev   (http://localhost:5173)

## Mode test (sans backend)
- Chaque service dans `src/services/` a une constante `USE_MOCK`.
  `true` : données fictives, `false` : vraie API.
- `src/context/AuthContext.jsx` : `DEV_MODE = true` connecte un utilisateur de test.
  Le bouton « Test » du menu bascule entre commerçant et admin.

## Pages
- Inscription commerçant : `/register/merchant`
- Espace commerçant : `/merchant` (tableau de bord, offres, commandes, scanner QR, commerce)
- Espace admin : `/admin` (tableau de bord, commerçants, utilisateurs)

## API
Voir `docs/API_CONTRACT.md`.