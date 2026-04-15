# GitHub OAuth Setup (NextAuth)

This guide explains how to create a GitHub OAuth app and configure the required environment variables for local development.

## 1) Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Open **OAuth Apps**.
3. Click **New OAuth App**.
4. Fill the form:
   - **Application name**: `Chatter Local`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Click **Register application**.
6. Copy the generated **Client ID**.
7. Click **Generate a new client secret** and copy the secret value.

## 2) Add environment variables

Create or update your `.env` file with:

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_a_long_random_secret
```

## 3) Generate a secure NEXTAUTH_SECRET

Use one of these commands:

```bash
openssl rand -base64 32
```

or:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output to `NEXTAUTH_SECRET`.

## 4) Validate locally

1. Run `pnpm dev`.
2. Visit `http://localhost:3000/auth/signin`.
3. Click **Continue with GitHub**.
4. Confirm redirect back to `/app`.
