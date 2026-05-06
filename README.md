# HealthBridge

B2B2C Health Platform — Studiumsprojekt Fernuni Hagen

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Fastify + TypeScript
- **Datenbank:** PostgreSQL + Prisma ORM
- **Cache / Echtzeit:** Redis + Socket.io
- **Auth:** NextAuth v5 (JWT)
- **Monorepo:** Turborepo

## Schnellstart (lokal)

### Voraussetzungen
- Node.js 20+
- Docker + Docker Compose

### 1. Repo klonen & Dependencies installieren
```bash
git clone https://github.com/Moritz-Staat/Healthbridge.git
cd Healthbridge
npm install
```

### 2. Umgebungsvariablen
```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Werte ggf. anpassen
```

### 3. Datenbank starten
```bash
docker compose up db redis -d
```

### 4. Datenbank migrieren & seeden
```bash
cd apps/api
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 5. Development starten
```bash
cd ../..
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **API Health:** http://localhost:4000/health

## Demo-Zugänge

| Role | E-Mail | Passwort |
|---|---|---|
| Patient | patient@healthbridge.de | password123 |
| Versicherung | admin@aok.de | password123 |
| System Admin | admin@healthbridge.de | password123 |

## Projekt-Struktur

```
healthbridge/
├── apps/
│   ├── api/          # Fastify Backend
│   │   ├── prisma/   # Schema + Migrations + Seed
│   │   └── src/
│   │       ├── modules/   # auth, patient, medications, metrics, alerts, insurance
│   │       ├── plugins/   # prisma, auth
│   │       ├── jobs/      # Cron Jobs
│   │       └── websocket/ # Socket.io
│   └── web/          # Next.js Frontend
│       └── src/
│           ├── app/       # Pages (patient, insurance, login)
│           ├── components/ # UI + Feature Components
│           └── lib/       # auth, api client
└── packages/
    └── shared-types/ # Geteilte TypeScript Types
```

## Alles mit Docker starten
```bash
docker compose up --build
```
