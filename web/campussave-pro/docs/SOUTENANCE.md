# Guide de soutenance (10 minutes)

## L'idée en une phrase
« Les commerces jettent leurs invendus, les étudiants ont peu de budget : CampusSave les met en relation en 3 minutes, avec un paiement sécurisé et un retrait par QR code. »

## Plan de démo (6 minutes)
Avant de commencer : `npm run dev`, Gmail configuré (`DEMO_EMAIL` = ta boîte) et ta boîte mail ouverte sur un second écran ou ton téléphone.

1. **Accueil** (30 s) : ticket qui se penche à la souris, chiffres d'impact en direct, FAQ. Montrer `Ctrl+K`.
2. **Connexion sécurisée** (1 min) : mot de passe → l'e-mail arrive dans la boîte → saisie du code (essayer d'abord un faux code pour montrer le compteur d'essais).
3. **Offres** (1 min) : recherche, filtres, favoris, fiche d'une offre, ajout au panier. Montrer qu'un panier ne mélange pas deux commerces.
4. **Réservation et paiement** (1 min 30) : compte à rebours de 10 minutes, carte, **code de confirmation d'achat reçu par e-mail** (avec le montant), validation.
5. **Ticket** (30 s) : confetti, QR code, e-mail de reçu avec QR, ajout à l'agenda.
6. **Commerçant** (1 min) : second navigateur, connexion `m@cafe.tn`, saisie du code → le ticket de l'étudiant passe à « Récupérée » **en direct**.
7. **Tableau de bord** (30 s) : badges, série, niveau, graphique.

## Points forts à dire à voix haute
- Vérification en **deux étapes** à la connexion **et** à l'achat : codes à usage unique, expirent en 10 minutes, 5 essais, hachés côté serveur.
- Architecture **client / API** séparée, contrat d'API respecté, **10 tests d'intégration** automatisés, CI.
- **PWA** installable, accessible au clavier, thème sombre, responsive.
- **Impact** : repas sauvés, économies, CO₂ évité, gamification (niveaux, badges, série).
- Stock géré de façon fiable : bloqué à la réservation, restitué automatiquement à l'expiration.

## Questions probables du jury
- **Le paiement est-il réel ?** Non, il est simulé pour la démo. Le point d'intégration est isolé (`payment.js`) : on branche Stripe, Konnect ou Flouci sans toucher au reste. La carte n'est jamais stockée.
- **Pourquoi un code à l'achat aussi ?** Pour qu'un mot de passe volé ne suffise pas à dépenser de l'argent. Le code rappelle le montant.
- **Que se passe-t-il si l'étudiant ne paie pas ?** La réservation expire après 10 minutes et le stock est remis en vente automatiquement.
- **Et si un commerçant scanne un code d'un autre commerce ?** L'API refuse (403). Un code déjà utilisé est refusé (409).
- **Comment éviter qu'on devine les codes ?** 1 million de combinaisons, 5 essais maximum, expiration 10 minutes, verrouillage du défi.
- **Pourquoi une base JSON ?** Zéro installation pour la démo ; la couche d'accès est isolée, on passe à PostgreSQL ou Firestore en remplaçant un seul fichier.
- **Passage à l'échelle ?** API sans état (JWT), prête à être répliquée derrière un équilibreur une fois la base externalisée.
- **Et l'accessibilité ?** Navigation clavier, labels, focus visibles, contrastes, `prefers-reduced-motion`, textes alternatifs.

## Plan B si Gmail ne répond pas
Retirer `SMTP_USER` / `SMTP_PASS` de `server/.env` et relancer : le mode démo affiche le code dans l'interface, la démo continue sans internet.
