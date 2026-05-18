import { searchShows } from "@/lib/tmdb";

export default async function handler(req, res) {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json({ results: [] });
    const results = await searchShows(q);
    res.json({ query: q, results });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}
