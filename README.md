# Portfolia Connected (Frontend + Backend)

Your friend's portfolio app, connected to the Firebase auth backend, restyled closer to [new-portfolio-r73h.vercel.app](https://new-portfolio-r73h.vercel.app).

## Structure

```
portfolia-connected/
├── backend/          ← Express + Firebase Admin API
│   ├── controllers/
│   ├── routes/
│   ├── firebase.js
│   ├── server.js
│   └── serviceAccountKey.json   ← YOU MUST ADD THIS
└── frontend/         ← React + Vite + Tailwind (Portfolia-style UI)
    └── src/
```

## 1. Backend setup (required)

1. Open Firebase Console → Project settings → **Service accounts**
2. Generate a new private key → save as:
   ```
   backend/serviceAccountKey.json
   ```
3. Copy `backend/.env.example` → `backend/.env`
4. Set your **Web API Key** (Project settings → General):
   ```
   FIREBASE_WEB_API_KEY=AIza...
   ```
5. Run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   API runs at `http://localhost:3000`

### API

| Method | Path | Body |
|--------|------|------|
| POST | `/api/signup` | `{ name, email, password }` |
| POST | `/api/signin` | `{ email, password }` |

## 2. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

When the backend is deployed (Render / Railway / etc.), change `VITE_API_URL` to that URL.

```bash
npm run dev
```

## 3. Deploy

- **Frontend** → Vercel (import the `frontend` folder or repo root if you only push frontend)
- **Backend** → Render / Railway / Fly.io (needs `serviceAccountKey.json` + env vars)

On the frontend Vercel project, set:
```
VITE_API_URL=https://your-backend-url
```

## What changed vs friend's original code

- Login + Signup now call the **real backend**
- UI moved toward Portfolia cream / soft green style
- Sidebar matches Portfolia workspace layout
- Routes are protected (must sign in)
- Portfolio features (templates, create, my portfolios, settings) kept
