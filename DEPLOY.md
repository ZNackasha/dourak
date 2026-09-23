# Deployment Guide for Dourak

This guide will help you deploy Dourak to Vercel.

## Prerequisites

1.  A [GitHub](https://github.com) account.
2.  A [Vercel](https://vercel.com) account.
3.  A [Resend](https://resend.com) account (for emails).
4.  A Keycloak server running the `dourak` realm (see "Keycloak server" below).
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
| `KEYCLOAK_ISSUER`       | `https://auth.dourak.app/realms/dourak`       | Keycloak realm issuer URL                        |
| `KEYCLOAK_CLIENT_ID`    | `dourak`                                      | Client defined in the realm file                 |
| `KEYCLOAK_CLIENT_SECRET`| `[KC_DOURAK_CLIENT_SECRET from the VM]`       | Must match the secret Keycloak was started with  |
| `KEYCLOAK_IDP_HINT`     | *(optional)* `google`                         | Skip the Keycloak login page and go to Google    |
| `GOOGLE_CLIENT_ID`      | `[Your Google Client ID]`                     | Separate Google Calendar OAuth client            |
| `GOOGLE_CLIENT_SECRET`  | `[Your Google Client Secret]`                 | Separate Google Calendar OAuth client            |
| `EMAIL_FROM`            | `onboarding@dourak.app`                       | Your verified sender                             |
| `EMAIL_SERVER`          | `smtp://resend:[API_KEY]@smtp.resend.com:465` | SMTP connection string                           |

**Important:**

- The realm's redirect and post-logout URLs are generated from
  `DOURAK_APP_URL` on the Keycloak server, so set it to `https://dourak.app`.
- Add `https://auth.dourak.app/realms/dourak/broker/google/endpoint` to the
  Google OAuth client used for sign-in.
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
- Use one stable production origin in `APP_URL`, and use the same origin for
  `DOURAK_APP_URL` on the Keycloak server.
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

Visit the production URL, sign in through Keycloak, then connect Google Calendar
from an admin workflow to verify the independent OAuth integration.

## Keycloak server

Keycloak runs on a Google Cloud free-tier VM using the files in `keycloak/`.

Create the VM in the Google Cloud console with:

- **Machine type:** `e2-micro`, in `us-west1`, `us-central1`, or `us-east1`
- **Boot disk:** Debian 12, **Standard persistent disk**, 30 GB. The default
  "Balanced" disk type is not covered by the free tier.
- **Firewall:** allow HTTP and HTTPS traffic
- **External IP:** reserve a static address so DNS keeps working after a
  restart. A public IPv4 costs about $3.65/month; it is not free.

Point an `A` record for `auth.dourak.app` at that IP, then on the VM:

```bash
git clone <this repo> && cd dourak/keycloak
./setup-vm.sh            # adds swap and installs Docker; log out and back in
cp .env.example .env     # fill in every value
docker compose up -d --build
```

Caddy obtains the HTTPS certificate automatically once DNS resolves. The admin
console is then at `https://auth.dourak.app`.

The realm file is imported only when the realm does not exist yet. After the
first start, change realm settings in the admin console. To serve other
projects, add another `<realm>-realm.json` to `keycloak/realms/`.

Back up the `postgres-data` Docker volume; it holds every user account.
