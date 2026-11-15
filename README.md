# 🌱 Sproutly

A mobile-friendly tracker for baby formula bottles. Tap **Made milk**, then follow each bottle through the fridge and feeding with a live spoil countdown. Data lives in Firestore, and every action posts a card to a Discord channel.

## Spoil rules (CDC guidance for prepared formula)

| Action | Spoils at |
|---|---|
| Made milk | 2h after made |
| Put in fridge | 24h after made |
| Take out of fridge | 2h from now, capped at 24h after made (can't go back in) |
| Started feeding | 1h from now, never later than the current limit |

Once a bottle spoils, the only option is **Discard**.

## Setup

1. **Firebase project** at https://console.firebase.google.com
   - Add a Web app and copy its config into `NEXT_PUBLIC_FIREBASE_*`.
   - Authentication → enable **Email/Password**, then add the one user that will sign in.
   - Firestore → create a database.
   - Project settings → Service accounts → generate a private key. Copy `project_id`, `client_email` and `private_key` into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.
2. **Security rules**: the project is `boseriko-apps` (set in `.firebaserc` and the deploy workflow). Run `npx firebase-tools login:ci` and save the token as the `FIREBASE_LOGIN_TOKEN` GitHub secret. From then on, every push to `main` that changes `firestore.rules`, `firestore.indexes.json` or `firebase.json` deploys them.
3. **Discord**: Channel settings → Integrations → Webhooks → New webhook. Copy the URL into `DISCORD_WEBHOOK_URL`.
4. Copy `example.env` to `.env.local` and replace each `XXXX` with a real value. `ALLOWED_EMAIL` is the account the app signs in as; the login screen only asks for its password.

## Run

```bash
pnpm install
pnpm dev
pnpm test
```

## Deploy

Push to GitHub, import into Vercel, and add the same env vars. On your phone, open the site and choose **Add to Home Screen**.
