# HealthBridge

B2B2C Health-Plattform — Studiumsprojekt Fernuni Hagen

Eine vollständige digitale Gesundheitsplattform, die Patienten, Angehörige und Krankenkassen vernetzt. Patienten tracken ihre Gesundheitsdaten über Wearables und einen smarten Medikamenten-Dispenser, Angehörige werden in Echtzeit über kritische Ereignisse informiert, und Krankenkassen können Bonuspunkte für gesundheitsförderndes Verhalten vergeben.

---

## Features

### Patienten-App (`/patient`)
- **Dashboard** — Übersicht mit aktuellen Vitalwerten, offenen Medikamenten, ungelösten Warnungen und nächsten Terminen
- **Gesundheitsmetriken** (`/patient/metrics`) — Interaktive Charts für 8 Metriktypen über 90 Tage:
  - Blutzucker (AreaChart, Referenzlinien bei 70/180 mg/dl, Time-in-Range, HbA1c-Schätzung)
  - Herzfrequenz (AreaChart, 60/100 bpm Referenzlinien)
  - Schritte (BarChart, Tageszielvisualisierung)
  - Schlaf (BarChart, farbcodiert nach Stunden)
  - Körpergewicht (LineChart mit linearer Trendlinie)
  - Statistische Auswertung: CV, Verteilung, Time-in-Range
- **Medikamente** (`/patient/medications`) — Aktive Medikamente mit Dosierung und Einnahmefrequenz; Einnahme bestätigen oder überspringen (mit Begründung)
- **Warnungen** (`/patient/alerts`) — Liste aller Alerts mit Schweregrad (LOW/MEDIUM/HIGH/CRITICAL), Auflösen-Funktion
- **Termine** (`/patient/appointments`) — Arzttermine mit Datum, Arztname, Ort; neue Termine anlegen
- **Dispenser** (`/patient/dispenser`) — Smart Dispenser Status (online/offline, Seriennummer, letzte Ausgabe), Dosierungsplan pro Medikament, Demo-Auslösebutton, Webhook-Dokumentation für Hardware-Integration
- **Profil** (`/patient/profile`) — Patientendaten, Einwilligungsstatus, verknüpfte Krankenkasse

### Familien-App (`/family`)
- **Dashboard** (`/family/dashboard`) — Alle verknüpften Patienten auf einen Blick:
  - Blutzucker-Badge (grün/gelb/rot je nach Wert)
  - Schritte des Tages
  - 7-Tage Medikamenten-Adherence
  - Bonuspunkte-Gesamtstand
  - Medikamentenstatus heute (eingenommen ✓ / übersprungen – / nicht eingenommen ✗)
  - Offene Warnungen nach Schweregrad
  - Nächste Arzttermine
  - **Echtzeit-Benachrichtigungen** via Socket.io (neue Alerts erscheinen sofort ohne Reload)
- **Warnungen** (`/family/alerts`) — Alle Alerts aller verknüpften Patienten, sortiert nach Zeitstempel, aufgelöst/offen getrennt

### Versicherungs-Portal (`/insurance`)
- **Dashboard** (`/insurance/dashboard`) — KPIs: aktive Patienten, durchschnittliche Adherence, vergebene Bonuspunkte
- **Patienten** (`/insurance/patients`) — Liste aller Versicherten mit Adherence-Rate und Bonuspunkten
- **Bonus vergeben** (`/insurance/bonus`) — Manuelle Bonuspunkte-Vergabe für Patienten nach Kategorie (Adherence, Aktivität, Check-in, Gesundheitsverbesserung)

### Smart Dispenser Integration
- **Hardware Webhook** `POST /api/dispenser/webhook/:deviceId` — Dispenser meldet Ausgabe, erstellt automatisch MedicationLog; bei Fehlercode (JAM, EMPTY, POWER_LOSS) wird Alert ausgelöst und per WebSocket gepusht
- **Device-Auth** via `X-Device-Token` Header
- **Bonus-Automatik** — Jede erfolgreiche Dispenser-Bestätigung vergibt 10 Bonuspunkte

### Echtzeit-System
- Socket.io-Räume pro Patient (`patient:{id}`) und Angehöriger (`family:{id}`)
- Alerts werden serverseitig getriggert und sofort an alle verbundenen Clients gepusht
- Cron-Job prüft stündlich verpasste Medikamente und erzeugt `MEDICATION_MISSED` Alerts

---

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router, Server Components) + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Backend | Fastify + TypeScript |
| ORM | Prisma + PostgreSQL 16 |
| Echtzeit | Redis + Socket.io |
| Auth | NextAuth v5 (JWT, role-based) |
| Monorepo | Turborepo |
| Deployment | Docker Compose + nginx-proxy-manager |

---

## Demo-Zugänge

| Rolle | E-Mail | Passwort |
|---|---|---|
| Patient | patient@healthbridge.de | password123 |
| Angehörige | anna@family.de | password123 |
| Versicherung | insurance@healthbridge.de | password123 |

---

## Projekt-Struktur

```
healthbridge/
├── apps/
│   ├── api/                    # Fastify Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 12 Modelle, 7 Enums
│   │   │   └── seed.ts         # 90-Tage realistische Demodaten
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/       # Login, /me
│   │       │   ├── patient/    # Patientenprofil
│   │       │   ├── health-metrics/
│   │       │   ├── medications/
│   │       │   ├── alerts/
│   │       │   ├── insurance/  # Portal-Endpunkte
│   │       │   ├── family/     # Familien-Endpunkte mit Zugangskontrolle
│   │       │   └── dispenser/  # Webhook + Status + Simulation
│   │       ├── plugins/        # prisma, auth (JWT-Middleware)
│   │       ├── jobs/           # Medication-Check Cron
│   │       └── websocket/      # Socket.io Alert-Emitter
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/
│           │   ├── patient/    # Dashboard, Metrics, Medications, Alerts,
│           │   │               # Appointments, Dispenser, Profile
│           │   ├── family/     # Dashboard, Alerts
│           │   ├── insurance/  # Dashboard, Patients, Bonus
│           │   └── login/
│           ├── components/
│           │   ├── charts/     # GlucoseChart, StepsChart, WeightChart,
│           │   │               # HeartRateChart, SleepChart, AdherenceChart,
│           │   │               # GlucoseStats
│           │   ├── patient/    # MedicationActions, ResolveAlertButton,
│           │   │               # DispenserSimulateButton
│           │   ├── insurance/  # AwardBonusForm
│           │   └── ui/         # Card, NavBar, AlertListener, Providers
│           └── lib/
│               ├── api.ts      # Typisierter API-Client (SSR + CSR)
│               ├── auth.ts     # NextAuth Konfiguration
│               └── middleware.ts # Rollenbasiertes Routing
└── packages/
    └── shared-types/           # Geteilte TypeScript Types + Konstanten
```

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- Docker + Docker Compose

### Setup
```bash
git clone https://github.com/Moritz-Staat/Healthbridge.git
cd Healthbridge
npm install

cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Datenbank starten
docker compose up db redis -d

# Schema anwenden & Demodaten einspielen
cd apps/api
npx prisma db push
npx tsx prisma/seed.ts

# Dev-Server starten
cd ../..
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

### Alles mit Docker
```bash
docker compose up --build -d
docker exec healthbridge-api sh -c 'cd /app/apps/api && npx prisma db push && npx tsx prisma/seed.ts'
```

---

## API-Endpunkte (Auswahl)

| Method | Path | Beschreibung |
|---|---|---|
| POST | `/api/auth/login` | Login, gibt JWT zurück |
| GET | `/api/auth/me` | Eigene User-Info |
| GET | `/api/patients/me` | Patientenprofil |
| GET | `/api/patients/:id/metrics` | Gesundheitsmetriken (filter: type, from, to) |
| GET | `/api/patients/:id/metrics/latest` | Letzter Wert pro Metrik |
| GET | `/api/patients/:id/medications` | Aktive Medikamente |
| POST | `/api/patients/medications/:id/log/taken` | Einnahme bestätigen |
| POST | `/api/patients/medications/:id/log/skipped` | Einnahme überspringen |
| GET | `/api/patients/:id/alerts` | Warnungen (filter: resolved) |
| PATCH | `/api/patients/alerts/:id/resolve` | Warnung auflösen |
| GET | `/api/patients/:id/appointments` | Termine |
| GET | `/api/patients/:id/bonus` | Bonuspunkte |
| GET | `/api/family/my-patients` | Verknüpfte Patienten (FAMILY_MEMBER) |
| GET | `/api/family/patient/:id/overview` | Übersicht inkl. Adherence |
| GET | `/api/family/patient/:id/glucose-history` | 14-Tage Glukoseverlauf |
| GET | `/api/family/patient/:id/alerts` | Alerts des Patienten |
| POST | `/api/dispenser/webhook/:deviceId` | Hardware-Webhook |
| GET | `/api/dispenser/patient/:id/status` | Dispenser-Status |
| POST | `/api/dispenser/patient/:id/simulate-dispense` | Demo-Auslösung |
| GET | `/api/insurance/me/patients` | Alle Versicherten |
| GET | `/api/insurance/me/stats` | Aggregierte KPIs |
| POST | `/api/insurance/me/bonus` | Bonuspunkte vergeben |

---

## Datenmodell

12 Prisma-Modelle: `User`, `Patient`, `HealthMetric`, `Medication`, `MedicationLog`, `FamilyMember`, `Alert`, `WearableDevice`, `Appointment`, `InsuranceCompany`, `InsuranceAdmin`, `BonusPoint`

Seed generiert 90 Tage realistische Daten mit Gaußscher Verteilung:
- 651 Gesundheitsmetriken (Blutzucker 3×/Tag mit Mahlzeiten-Pattern, Gewichtstrend −3,3 kg)
- 273 Medikamentenlogs (~85 % Adherence)
- 15 Alerts (10 aufgelöst), 20 Bonuspunkte, 5 Termine
- Anna Mustermann als verknüpfter Angehöriger mit eigenem Login
- Smart Dispenser Gerät (HBD-2024-00142)
