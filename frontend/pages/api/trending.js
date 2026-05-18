import { getTrendingShows, getNewReleaseShows } from "@/lib/tmdb";

export default async function handler(req, res) {
  try {
    const { section = "trending", genre = "all" } = req.query;
    const data =
      section === "new-releases"
        ? await getNewReleaseShows(genre)
        : await getTrendingShows(genre);
    res.json({ section, genre, results: data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}
