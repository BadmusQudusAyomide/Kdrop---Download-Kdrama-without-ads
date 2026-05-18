import { getShowDetails } from "@/lib/tmdb";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const result = await getShowDetails(id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}
