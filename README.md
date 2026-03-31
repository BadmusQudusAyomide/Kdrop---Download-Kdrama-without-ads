# KDrop

A KDrama discovery and download site with live TMDB metadata and live Consumet download resolution.

## Environment

Backend `.env`:

- `PORT=5000`
- `TMDB_API_KEY=your_tmdb_api_key`
- `CONSUMET_BASE_URL=https://your-consumet-instance.onrender.com`

Frontend `.env.local`:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`

## Deployment

Frontend on Vercel:

- Root directory: `frontend`
- Framework preset: `Next.js`
- Environment variable: `NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com`

Backend on Render:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `TMDB_API_KEY`
  - `CONSUMET_BASE_URL`

Consumet on Render:

- Deploy your separate Consumet service first
- Copy its live base URL into the backend `CONSUMET_BASE_URL`

## Local Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## API Routes

- `GET /api/trending`
- `GET /api/trending?section=new-releases`
- `GET /api/search?q=queen`
- `GET /api/show/:id`
- `GET /api/download?show=Queen%20of%20Tears&ep=1`
