# Church Scheduler

Volunteer coordination app built with Next.js App Router, Prisma, Postgres, and NextAuth (Google).

## Features

- **Google Calendar Integration**: Link your Google Calendar to import events.
- **Schedule Management**: Create schedules for specific time periods based on your calendar events.
- **Volunteer Assignments**: Assign volunteers to specific shifts within events.
- **Google Auth**: Secure login with Google.

## Prerequisites

- Node 18+
- Postgres database (Docker Compose included)
- Google Cloud Project with Calendar API enabled

## Environment variables

Copy `.env` and populate the following values:

```env
DATABASE_URL="postgresql://church_admin:church_admin@localhost:5434/church_scheduler?schema=public"
NEXTAUTH_SECRET="use `openssl rand -base64 32`"
GOOGLE_CLIENT_ID="Google OAuth client id"
GOOGLE_CLIENT_SECRET="Google OAuth client secret"
```

**Important**: You must enable the **Google Calendar API** in your Google Cloud Console and add `http://localhost:3000/api/auth/callback/google` to the authorized redirect URIs.

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

1. **Sign in with Google** (Basic profile access).
2. **Create a Schedule**:
   - You will be prompted to grant **Google Calendar permissions** if you haven't already.
   - Select a Google Calendar and a date range to import events.
3. **Manage Events**: View imported events and assign volunteers.

