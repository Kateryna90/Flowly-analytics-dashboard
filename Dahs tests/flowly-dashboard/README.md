# Flowly Dashboard

Vite + React + Tailwind + Recharts. Ready to deploy on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Deploy to Vercel — option A: CLI (fastest)

1. Install the Vercel CLI once: `npm i -g vercel`
2. From this folder run: `vercel`
3. Log in when prompted, accept all the defaults (Vite is auto-detected)
4. Run `vercel --prod` to get a permanent production URL

The CLI prints the live link in the terminal.

## Deploy to Vercel — option B: GitHub (gets you CI/CD)

1. Create a new GitHub repo
2. In this folder: `git init && git add . && git commit -m "init" && git remote add origin <repo-url> && git push -u origin main`
3. Go to https://vercel.com/new, import the repo, click Deploy
4. Vercel auto-detects Vite, builds, and gives you a `<project>.vercel.app` URL
5. Every future push to `main` triggers a redeploy; PRs get preview URLs

## Notes

- The component lives in `src/FlowlyDashboard.jsx`.
- All mock data is generated in-component; no backend or env vars required.
- Inter font loads from Google Fonts at runtime.
