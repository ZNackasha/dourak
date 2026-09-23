# Dourak

Volunteer coordination app built with Next.js App Router, Prisma, PostgreSQL, and Keycloak OIDC.

## Features

- **Keycloak authentication**: Sign in with Google or email through the `dourak` realm.
- **Google Calendar integration**: Link a Google account separately to import events.
- **Schedule management**: Create schedules and assign volunteers to event shifts.

## Prerequisites

- Node 20+
- Docker (runs Postgres and a local Keycloak)
- Google Cloud Project with Calendar API enabled

## Environment variables

Copy `.env.example` to `.env`. The Keycloak defaults already match the local
container:

```env
APP_URL="http://localhost:3000"
KEYCLOAK_ISSUER="http://localhost:8181/realms/dourak"
KEYCLOAK_CLIENT_ID="dourak"
KEYCLOAK_CLIENT_SECRET="dourak-dev-secret"
```

The realm is defined in `keycloak/realms/dourak-realm.json` and imported on
first start. Its Google provider reads `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` from `.env`. Add this redirect URI to that Google OAuth
client:

- `http://localhost:8181/realms/dourak/broker/google/endpoint`

Google Calendar uses a separate OAuth flow. Enable the Google Calendar API and add `http://localhost:3000/api/auth/google/callback` as its redirect URI.

The Keycloak admin console is at `http://localhost:8181` (`admin` / `admin`).

## Install & database setup

```bash
npm install
# Start Postgres and Keycloak
docker compose up -d
# Apply migrations
npx prisma migrate dev
```

## Running the app

```bash
npm run dev
```

Navigate to `http://localhost:3000`.

## Workflow

1. Sign in through Keycloak.
2. Connect Google Calendar only when calendar access is needed.
3. Create schedules, import events, and assign volunteers.

