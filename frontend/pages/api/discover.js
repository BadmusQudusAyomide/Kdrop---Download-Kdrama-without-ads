import { discoverShows } from "@/lib/tmdb";

export default async function handler(req, res) {
  try {
    const { page = "1", genre = "all" } = req.query;
    const data = await discoverShows(page, genre);
    res.json({ genre, ...data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}