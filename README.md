# KDrop

A KDrama discovery and episode-link site with live TMDB metadata and backend provider resolution.

## Environment

Backend `.env`:

- `PORT=5000`
- `TMDB_API_KEY=your_tmdb_api_key`
- `YT_DLP_PATH=yt-dlp`

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
  - `YT_DLP_PATH`

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
- `GET /api/download?show=Queen%20of%20Tears&ep=1&season=1&year=2024`
