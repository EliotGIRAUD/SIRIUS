# SIRIUS — Simulation adoption 30 jours

Monorepo pour la simulation d'adoption canine (Labrador) sur 30 jours, avec interface adoptant (B2C), portail refuge (B2B web) et app mobile Pro légère.

## Structure

```
apps/mobile/      Expo React Native (adoptant + pro mobile)
apps/web-pro/     Portail web refuge (Vite + React)
packages/shared/  Règles Labrador, types, catalogue boutique
services/api/     API Express + MongoDB
```

## Prérequis

- Node.js 20+
- MongoDB (local ou Docker)

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Builder le package partagé
npm run build --workspace=@sirius/shared

# Lancer MongoDB (Docker)
docker compose up mongo -d

# Seed des données demo
npm run seed --workspace=@sirius/api

# API (port 3001 — le port 3000 est souvent déjà pris par un autre service Docker)
npm run dev --workspace=@sirius/api

# Portail web Pro (port 5173)
npm run dev --workspace=@sirius/web-pro

# App mobile
npm run dev --workspace=@sirius/mobile
```

## Comptes demo (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Refuge | pro@spa-demo.fr | shelter123 |
| Adoptant | adopter@demo.fr | adopter123 |

Code refuge : `SPADEMO1`

## API principale

### Auth
- `POST /auth/register` — Inscription adoptant (proCode requis)
- `POST /auth/register-shelter` — Inscription refuge
- `POST /auth/login`

### B2C (JWT adopter)
- `POST /simulation/start`
- `POST /simulation/action`
- `GET /simulation/status`
- `POST /simulation/advance-day`
- `GET /simulation/shop`

### B2B (JWT shelter)
- `POST /pro/codes`
- `GET /pro/clients`
- `GET /pro/client/:id/metrics`
- `POST /pro/client/:id/validate`
- `GET /pro/client/:id/attestation.pdf`

## Variables d'environnement

Voir [`services/api/.env.example`](services/api/.env.example).

## Tests

```bash
npm run test --workspace=@sirius/api
```
