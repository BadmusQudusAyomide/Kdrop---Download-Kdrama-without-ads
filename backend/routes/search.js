const express = require("express");
const { searchShows } = require("../services/tmdb");

const router = express.Router();

router.get("/", async (request, response, next) => {
  try {
    const { q = "" } = request.query;

    if (!q.trim()) {
      return response.json({ results: [] });
    }

    const results = await searchShows(q);
    response.json({ query: q, results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
