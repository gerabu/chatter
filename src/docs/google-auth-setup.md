# Google OAuth Setup (NextAuth)

This guide explains how to create Google OAuth credentials and configure the required environment variables for local development.

## 1) Create Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Open **APIs & Services** > **OAuth consent screen**:
   - Choose **External** user type.
   - Set app name (for example: `Chatter Local`).
   - Add your email in support/developer contact fields.
   - Save and continue with default scopes for local setup.
4. Open **APIs & Services** > **Credentials**.
5. Click **Create Credentials** > **OAuth client ID**.
6. Choose **Web application**.
7. Set:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
8. Create the client and copy **Client ID** and **Client secret**.

## 2) Add environment variables

Create or update your `.env` file with:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_a_long_random_secret
```

If `NEXTAUTH_SECRET` is already set from GitHub setup, keep using the same value.

## 3) Generate a secure NEXTAUTH_SECRET (if needed)

```bash
openssl rand -base64 32
```

## 4) Validate locally

1. Run `pnpm dev`.
2. Visit `http://localhost:3000/auth/signup` or `http://localhost:3000/auth/signin`.
3. Click the Google auth button.
4. Confirm redirect back to `/app`.
