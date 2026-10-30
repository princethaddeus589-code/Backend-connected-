# Portfolia Auth Backend

Firebase Authentication API for the portfolio app.

## Required setup

1. Place your Firebase **service account** file as:
   ```
   serviceAccountKey.json
   ```
   (Download from Firebase Console → Project settings → Service accounts → Generate new private key)

2. Copy `.env.example` to `.env` and set:
   ```
   FIREBASE_WEB_API_KEY=your-web-api-key
   ```
   (Found in Firebase Console → Project settings → General → Your apps → Web API Key)

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## API

| Method | Path | Body |
|--------|------|------|
| POST | `/api/signup` | `{ "name", "email", "password" }` |
| POST | `/api/signin` | `{ "email", "password" }` **or** `{ "idToken" }` |

Server default: `http://localhost:3000`
