# Inclusive AI Classroom Copilot

An accessible study workspace with simpler explanations, translations, speech playback, quizzes, and locally saved sessions. The Express backend uses Groq chat completions when configured and retains the clearly labelled, prewritten demo mode when the API key is absent.

## Requirements

- Node.js 22 LTS (Node 20.19+ is also suitable for the frontend)
- npm
- A Groq API key for live AI. The app can run without one in demo mode.

The default model is `llama-3.3-70b-versatile`, listed in Groq's [Production Models documentation](https://console.groq.com/docs/models) and used in its [official Quickstart](https://console.groq.com/docs/quickstart). Override it with `GROQ_MODEL` if needed.

## Configure the backend

From the repository root in Windows PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `GROQ_API_KEY` to a newly issued Groq API key in the root `.env` file. Keep this file private; it is ignored by Git. Do not use a key that has been pasted into chat or committed to source control. `GROQ_MODEL` is already set to the documented default model above. Leave the key empty to run in demo mode.

The server loads this root `.env` when it starts from the `server` directory. The key is only used by the backend and is never sent to the browser.

For local frontend development, create `client/.env.local` from its example:

```powershell
Copy-Item client/.env.example client/.env.local
```

It sets `VITE_API_URL=http://localhost:3001`. Vite must be restarted after changing this value.

## Install dependencies

Run once from the repository root:

```powershell
Push-Location server
npm ci
Pop-Location
Push-Location client
npm ci
Pop-Location
```

## Start the application

Open two PowerShell terminals at the repository root.

Terminal 1, backend API at `http://localhost:3001`:

```powershell
Set-Location server
npm run dev
```

Terminal 2, Vite frontend at `http://127.0.0.1:5173`:

```powershell
Set-Location client
npm run dev -- --host 127.0.0.1 --port 5173
```

The client calls the backend URL configured by `VITE_API_URL`; no Vite proxy is used. The backend's local CORS origins default to `http://localhost:5173` and `http://127.0.0.1:5173`. Set `CORS_ORIGIN` in the root `.env` to a comma-separated allowlist if your local frontend origin differs.

## Check the service

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

With no `GROQ_API_KEY`, the health response reports `mode: demo`. With a configured key it reports `mode: ai` (this confirms configuration only; it does not validate the key against Groq).

Example missing-text validation check:

```powershell
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/ai/explain -ContentType 'application/json' -Body '{"text":"   "}'
} catch {
  $_.ErrorDetails.Message
}
```

## Build and lint

From the repository root:

```powershell
Push-Location server
npm run build
Pop-Location
Push-Location client
npm run build
npm run lint
Pop-Location
```

The AI endpoints accept study text up to 15,000 characters, are rate-limited, and use a 30-second Groq request timeout. Provider failures return a safe error and do not fall back to demo content; demo responses are used only when the key is missing at request time.

## Deploy to Netlify and Render

### Netlify frontend

Deploy the repository's `client` directory as the Netlify base directory:

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com`

Set `VITE_API_URL` to the Render service origin. The frontend API client appends `/api` exactly once, so either the origin or an origin ending in `/api` is accepted. The Groq key must never be set in Netlify or any `VITE_` variable. `client/public/_redirects` provides the React Router SPA fallback.

### Render backend

Create a Render **Web Service** from this repository:

- Root directory: `server`
- Runtime: Node
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

The package scripts confirm that `npm run build` runs `tsc` and `npm start` runs `node dist/index.js`. Include dev dependencies in the Render build because TypeScript is a build-time dev dependency and Render may set `NODE_ENV=production` during install. The server listens on Render's `PORT` and binds to `0.0.0.0`.

Add these Render environment variables:

- `NODE_ENV=production`
- `GROQ_API_KEY`: set the secret in Render's environment settings; do not put it in source control, Netlify, or a Vite variable.
- `GROQ_MODEL=llama-3.3-70b-versatile` (or another model currently enabled for your Groq account)
- `CORS_ORIGIN=https://<your-netlify-site>.netlify.app`

`CORS_ORIGIN` accepts a comma-separated list of exact origins. Add a Netlify custom domain or local origins only if that exact origin also needs access. Production startup fails if this variable is missing; the server never enables a wildcard origin.

### Local Vite API configuration

The checked-in `client/.env.example` contains the local development setting. Create the ignored local file in PowerShell:

```powershell
Copy-Item client/.env.example client/.env.local
```

The default `VITE_API_URL=http://localhost:3001` points at the backend. `client/src/services/documentExtraction.ts` uses PDF.js and Mammoth directly in the browser; PDF, DOCX, and TXT files are extracted locally and are not uploaded to Render.
