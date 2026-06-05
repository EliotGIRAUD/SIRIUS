# SIRIUS — Simulation adoption 30 jours

Monorepo pour la simulation d'adoption canine sur 30 jours (race Labrador en freemium), avec **app mobile B2C** (adoptant) et **portail web B2B** (refuge, éleveur, annonceur).

## Architecture

```
apps/mobile/      Expo React Native — adoptants uniquement (B2C)
apps/web-pro/     Portail web Vite + React + Tailwind — partenaires (B2B)
packages/shared/  Règles métier, races, tarifs B2C/B2B
services/api/     API Express + MongoDB (partagée par mobile et web)
```

| Canal | Utilisateurs | URL locale |
|-------|--------------|------------|
| App mobile | Adoptants | Expo Go → scan QR |
| Web-pro | Refuge SPA, éleveur, annonceur | http://localhost:5173 |
| API | Les deux | http://localhost:3001 |

> **Une seule API** sert l'app mobile et le portail web. Sur téléphone, l'URL API doit utiliser l'**IP locale du PC**, pas `localhost`.

## Prérequis

- Node.js 20+
- MongoDB (Docker recommandé)
- Expo Go sur téléphone (pour le mobile)

## Installation

```bash
npm install
npm run build --workspace=@sirius/shared
```

## Démarrage (PowerShell)

Ouvrir **3 terminaux** :

```powershell
# 1. MongoDB
docker compose up -d mongo

# 2. Données démo (une fois, ou après reset)
npm run seed --workspace=@sirius/api

# 3. API — port 3001
npm run dev --workspace=@sirius/api

# 4. Portail web B2B — port 5173
npm run dev --workspace=@sirius/web-pro

# 5. App mobile Expo
npm run start --workspace=@sirius/mobile
```

Vérifier l'API : http://localhost:3001/health → `{"status":"ok"}`

## Comptes démo (après seed)

### App mobile (adoptant uniquement)

| Email | Mot de passe |
|-------|--------------|
| `adopter@demo.fr` | `adopter123` |

Code vérification email : `123456`

### Portail web-pro (B2B)

| Espace | Email | Mot de passe |
|--------|-------|--------------|
| Refuge SPA | `pro@spa-demo.fr` | `shelter123` |
| Éleveur | `breeder@demo.fr` | `breeder123` |
| Annonceur | `sponsor@demo.fr` | `sponsor123` |

**Code refuge SPA** (inscription adoptant) : `SPADEMO1` (6 à 8 caractères)

Les comptes B2B refusés sur l'app mobile redirigent vers le portail web.

## App mobile — configuration réseau

Sur téléphone, `localhost` pointe vers le téléphone, pas le PC. Configurer `apps/mobile/.env` :

```env
# Remplacer par l'IPv4 Wi-Fi du PC (ipconfig)
EXPO_PUBLIC_API_URL=http://192.168.1.42:3001
EXPO_PUBLIC_WEB_PRO_URL=http://192.168.1.42:5173
```

Puis relancer Expo **avec cache vidé** :

```powershell
cd apps\mobile
npm start -- --clear
```

L'écran de login affiche l'URL API utilisée — vérifiez qu'elle n'est pas `localhost`.

### Dépannage « Network request failed »

1. **Test navigateur téléphone** : ouvrir `http://VOTRE_IP:3001/health`
2. **Même réseau** : PC et téléphone sur le même Wi-Fi (éviter le mode Tunnel Expo, préférer LAN)
3. **Wi-Fi campus / isolé** : utiliser le **partage de connexion 4G** du téléphone et connecter le PC au hotspot
4. **Android USB** : `npm run adb:reverse --workspace=@sirius/mobile` puis `EXPO_PUBLIC_API_URL=http://localhost:3001`
5. **Pare-feu Windows** (PowerShell admin) :
   ```powershell
   netsh advfirewall firewall add rule name="SIRIUS API Dev 3001" dir=in action=allow protocol=TCP localport=3001
   ```

## Portail web-pro

Stack : React 19, Vite, Tailwind CSS, React Router.

| Route | Espace | Description |
|-------|--------|-------------|
| `/login` | — | Connexion B2B |
| `/register` | — | Inscription refuge / éleveur / annonceur |
| `/shelter` | Refuge | Tableau de bord, KPI, liste adoptants |
| `/shelter/client/:id` | Refuge | Fiche adoptant, heatmap, validation PDF |
| `/shelter/codes` | Refuge | Codes SPA et codes adoptant |
| `/shelter/subscription` | Refuge | Abonnement 99 €/mois (mock) |
| `/breeder` | Éleveur | Dashboard, vues, abonnement |
| `/breeder/profile` | Éleveur | Fiche élevage |
| `/sponsor` | Annonceur | Campagnes sponsoring |
| `/sponsor/new` | Annonceur | Créer une campagne |

Tarifs centralisés dans `@sirius/shared` (`B2B_PLANS`, `B2C_PRODUCTS`). Paiements en **mode mock** jusqu'à intégration Stripe / IAP.

## API principale

Base : `http://localhost:3001`

### Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/validate-code` | Valider code SPA (6–8 car.) |
| POST | `/auth/register` | Inscription adoptant |
| POST | `/auth/register-shelter` | Inscription refuge |
| POST | `/auth/register-breeder` | Inscription éleveur |
| POST | `/auth/register-sponsor` | Inscription annonceur |
| POST | `/auth/login` | Connexion |
| POST | `/auth/verify-email` | Vérification email |
| GET | `/auth/me` | Profil courant (JWT) |

### B2C — adoptant (`JWT role: adopter`)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/simulation/start` | Démarrer simulation |
| POST | `/simulation/action` | Action (repas, eau, balade…) |
| GET | `/simulation/status` | État simulation |
| POST | `/simulation/advance-day` | Passer au jour suivant |
| GET | `/simulation/shop` | Boutique |
| POST | `/billing/purchase-mock` | Achat B2C mock (PDF, race) |

### B2B — refuge (`JWT role: shelter`)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/pro/codes` | Générer code adoptant |
| GET | `/pro/clients` | Liste adoptants |
| GET | `/pro/dashboard-stats` | KPI refuge |
| GET | `/pro/client/:id/metrics` | Métriques détaillées |
| POST | `/pro/client/:id/validate` | Valider attestation |
| GET | `/pro/client/:id/attestation.pdf` | Télécharger PDF |
| GET | `/pro/subscription` | Statut abonnement |
| POST | `/pro/subscription/activate-mock` | Activer abonnement mock |

### B2B — éleveur & annonceur

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/PATCH | `/breeders/me` | Fiche éleveur connecté |
| GET | `/breeders/recommended` | Éleveurs recommandés (mobile) |
| GET | `/sponsor/campaigns` | Campagnes de l'annonceur |
| POST | `/sponsor/campaigns` | Créer une campagne |
| POST | `/sponsor/campaigns/:id/activate-mock` | Activer campagne mock |
| POST | `/billing/subscribe-mock` | Abonnement B2B générique |

## Variables d'environnement

### `services/api/.env`

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/sirius
JWT_SECRET=dev-secret-change-me
CORS_ORIGINS=*
ATTESTATION_BASE_URL=http://localhost:3001
```

### `apps/web-pro/.env`

```env
VITE_API_URL=http://localhost:3001
```

### `apps/mobile/.env`

Voir [`apps/mobile/.env.example`](apps/mobile/.env.example).

## Fonctionnalités principales

### B2C (mobile)

- Simulation 30 jours (jauges, budget, score)
- Gamelle gyroscope (repas / eau)
- GPS balades, carte POI
- Constellation, journal, badges
- Catalogue races (Labrador gratuit, premium mock)
- Notifications contextuelles (sons aboiement)
- Abonnement freemium / premium (mock)

### B2B (web-pro)

- Suivi adoptants, heatmap 30 jours, métriques GPS
- Génération codes SPA / adoptant
- Validation et export PDF attestation
- Abonnements refuge (99 €), éleveur (129 €), sponsoring (99–1499 €) — mock

## Tests

```bash
npm run test --workspace=@sirius/api
npm run typecheck --workspace=@sirius/web-pro
```

## Scripts utiles

```bash
npm run dev          # Tous les workspaces en parallèle (Turbo)
npm run build        # Build global
npm run seed --workspace=@sirius/api   # Réinitialiser données démo
```

## Structure des workspaces

| Package | Nom npm |
|---------|---------|
| API | `@sirius/api` |
| Mobile | `@sirius/mobile` |
| Web B2B | `@sirius/web-pro` |
| Shared | `@sirius/shared` |
