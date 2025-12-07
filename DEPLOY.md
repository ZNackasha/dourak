# Deployment Guide for Dourak

This guide will help you deploy Dourak to Vercel.

## Prerequisites

1.  A [GitHub](https://github.com) account.
2.  A [Vercel](https://vercel.com) account.
3.  A [Resend](https://resend.com) account (for emails).
4.  A [Google Cloud Console](https://console.cloud.google.com) project (for Google Login & Calendar).

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

| Variable               | Value                                         | Description                                                        |
| :--------------------- | :-------------------------------------------- | :----------------------------------------------------------------- |
| `NEXTAUTH_SECRET`      | `[Generate a random string]`                  | You can generate one with `openssl rand -base64 32`                |
| `NEXTAUTH_URL`         | `https://your-project.vercel.app`             | Your Vercel deployment URL (add this after first deploy if needed) |
| `GOOGLE_CLIENT_ID`     | `[Your Google Client ID]`                     | From Google Cloud Console                                          |
| `GOOGLE_CLIENT_SECRET` | `[Your Google Client Secret]`                 | From Google Cloud Console                                          |
| `RESEND_API_KEY`       | `[Your Resend API Key]`                       | From Resend Dashboard                                              |
| `EMAIL_FROM`           | `onboarding@dourak.app`                       | Or your verified domain email                                      |
| `EMAIL_SERVER`         | `smtp://resend:[API_KEY]@smtp.resend.com:465` | Replace `[API_KEY]` with your Resend API Key                       |

**Important:**

- Update your **Google Cloud Console** "Authorized redirect URIs" to include:
  - `https://your-project.vercel.app/api/auth/callback/google`

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

Visit your Vercel URL and try to log in!

