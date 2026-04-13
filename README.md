# Moneetize Mini Prelaunch

Fresh mini version of the Moneetize scratch-and-win prelaunch app.

## Stack

- `frontend-moneetizeprelaunch/`: Vite React app connected to Supabase, with the richer profile, team, winnings, gameplay, and settings screens brought forward from the original Moneetize Prelaunch project.
- `backend/`: FastAPI service with Redis-backed caching and the prelaunch/catalog endpoints from the original build.
- `docker-compose.yml`: Redis container for the mini project on local port `6381`.
- `index.html`, `styles.css`, `app.js`: static mini prototype kept as reference material.
- `design-reference/`: provided screenshots for the updated flow.

## Flow

1. Sign-up
2. Scratch and Win
3. Reveal rewards and winnings
4. Grow your team
5. Create and complete profile
6. Profile tabs for Your Team, Invited Team, Winnings, and Gameplay

## Reward Engine

The mini build carries forward the weighted draw model from the previous Moneetize Prelaunch app:

- Blue Ticket: 45.0%
- Aqua Ticket: 30.0%
- Green Wild Card: 18.0%
- Pink Rare Wild Card: 6.5%
- Golden Ticket: 0.5%

Common tickets pay less, wild cards pay more, and the golden ticket is the rare top reward. Each draw adds USDT, points, locked gems, the wildcard item, and a tier-based merch chance.

## Run

Install dependencies:

```bash
npm install
cd frontend-moneetizeprelaunch
npm install
cd ..
backend\\.venv\\Scripts\\python.exe -m pip install -r backend\\requirements.txt
```

Start Redis:

```bash
docker compose up -d redis
```

Start the app:

```bash
npm run dev
```

Frontend: `http://127.0.0.1:3002`  
Backend health: `http://127.0.0.1:8000/api/health`

## Supabase

The frontend uses `@supabase/supabase-js` and the generated config at `frontend-moneetizeprelaunch/utils/supabase/info.tsx`. Auth, scratch draws, profile sync, network recommendations, and early access requests are wired through the inherited Supabase Edge Function service path.

## Repo

Target GitHub repository: https://github.com/moneetize/miniprelaunch
