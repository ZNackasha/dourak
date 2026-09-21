# Dourak

Volunteer coordination app built with Next.js App Router, Prisma, PostgreSQL, and Zitadel OIDC.

## Features

- **Zitadel authentication**: Sign in through the Dourak Zitadel organization.
- **Google Calendar integration**: Link a Google account separately to import events.
- **Schedule management**: Create schedules and assign volunteers to event shifts.

## Prerequisites

- Node 20+
- Postgres database (Docker Compose included)
- A Zitadel Web OIDC application
- Google Cloud Project with Calendar API enabled

## Environment variables

Copy `.env.example` to `.env` and populate the provider credentials:

```env
APP_URL="http://localhost:3000"
ZITADEL_ISSUER="https://your-instance.zitadel.cloud"
ZITADEL_CLIENT_ID="your Zitadel client id"
ZITADEL_CLIENT_SECRET="your Zitadel client secret"
```

Configure the Zitadel application as a Web application using Authorization Code, PKCE, and Basic client authentication. Add these local URLs:

- Redirect URI: `http://localhost:3000/api/auth/zitadel/callback`
- Post-logout URI: `http://localhost:3000/`

Google Calendar uses a separate OAuth client. Enable the Google Calendar API and add `http://localhost:3000/api/auth/google/callback` as its redirect URI.

## Install & database setup

```bash
npm install
# Start local database
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

1. Sign in through Zitadel.
2. Connect Google Calendar only when calendar access is needed.
3. Create schedules, import events, and assign volunteers.

