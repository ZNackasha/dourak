# Deployment Guide for Dourak

This guide will help you deploy Dourak to Vercel.

## Prerequisites

1.  A [GitHub](https://github.com) account.
2.  A [Vercel](https://vercel.com) account.
3.  A [Resend](https://resend.com) account (for emails).
4.  A Zitadel Web OIDC application in the Dourak organization.
5.  A Google Cloud project with the Calendar API enabled.

## Step 1: Push to GitHub

1.  Initialize a git repository if you haven't already:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repository on GitHub.
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/dourak.git
    git branch -M main
    git push -u origin main
    ```

## Step 2: Create Project on Vercel

1.  Log in to Vercel and click **"Add New..."** -> **"Project"**.
2.  Import your `dourak` repository.
3.  **Configure Project:**
    - **Framework Preset:** Next.js (should be detected automatically).
    - **Root Directory:** `./` (default).

## Step 3: Configure Storage (Database)

1.  In the Vercel project creation flow (or in the Storage tab after creation), click **"Storage"**.
2.  Click **"Connect Store"** -> **"Create New"** -> **"Postgres"**.
3.  Accept the terms and create the database.
4.  Select the region closest to your users (e.g., Washington, D.C. - iad1).
5.  Click **"Connect"**.
    - _Note: This will automatically add `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, etc., to your environment variables._

## Step 4: Configure Environment Variables

Expand the **"Environment Variables"** section and add the following:

| Variable                | Value                                         | Description                                      |
| :---------------------- | :-------------------------------------------- | :----------------------------------------------- |
| `APP_URL`               | `https://dourak.app`                          | Public origin used by OIDC callbacks             |
| `NEXT_PUBLIC_SITE_URL`  | `https://dourak.app`                          | Primary public domain used for canonical URLs    |
| `ZITADEL_ISSUER`        | `https://your-instance.zitadel.cloud`         | Zitadel instance issuer, without a trailing path |
| `ZITADEL_CLIENT_ID`     | `[Your Zitadel Client ID]`                    | From the Dourak Zitadel OIDC application         |
| `ZITADEL_CLIENT_SECRET` | `[Your Zitadel Client Secret]`                | From the Dourak Zitadel OIDC application         |
| `GOOGLE_CLIENT_ID`      | `[Your Google Client ID]`                     | Separate Google Calendar OAuth client            |
| `GOOGLE_CLIENT_SECRET`  | `[Your Google Client Secret]`                 | Separate Google Calendar OAuth client            |
| `EMAIL_FROM`            | `onboarding@dourak.app`                       | Your verified sender                             |
| `EMAIL_SERVER`          | `smtp://resend:[API_KEY]@smtp.resend.com:465` | SMTP connection string                           |

**Important:**

- Configure the Zitadel application as **Web**, with Authorization Code, PKCE,
  and Basic client authentication.
- Add `https://dourak.app/api/auth/zitadel/callback` as an allowed redirect URI.
- Add `https://dourak.app/` as an allowed post-logout URI.
- Add `https://dourak.app/api/auth/google/callback` to the separate Google
  Calendar OAuth client's authorized redirect URIs.

### Multiple domains & SEO

Dourak can be served under several domains at once (e.g. `dourak.app`,
`dourak.z-soft.dev`, and the Vercel preview/production URLs). To avoid
duplicate-content penalties, search engines must be told which domain is
**canonical**:

- Set `NEXT_PUBLIC_SITE_URL` to your single primary domain (e.g.
  `https://dourak.app`) on **all** deployments. Every domain will then emit a
  `<link rel="canonical">`, `sitemap.xml`, and `robots.txt` pointing at that
  primary domain, consolidating your SEO ranking.
- Use one stable production origin in `APP_URL`. Add its Zitadel callback and
  post-logout URLs to the OIDC application.
- If `NEXT_PUBLIC_SITE_URL` is not set, canonical URLs fall back to Vercel's
  production URL and then `https://dourak.app`.

## Step 5: Deploy

1.  Click **"Deploy"**.
2.  Wait for the build to complete.

## Step 6: Run Database Migrations

Once the project is deployed, the database will be empty. You need to run the migrations against the production database.

You can do this from your local machine by connecting to the Vercel database:

1.  Install the Vercel CLI: `npm i -g vercel`
2.  Link your local project: `vercel link`
3.  Pull the environment variables: `vercel env pull .env.production`
4.  Run the migration:
    ```bash
    npx dotenv -e .env.production -- npx prisma migrate deploy
    ```

Alternatively, you can add a build command in `package.json` to run migrations on deploy, but running them manually is safer for now.

## Step 7: Verify

Visit the production URL, sign in through Zitadel, then connect Google Calendar
from an admin workflow to verify the independent OAuth integration.
