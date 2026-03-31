const express = require("express");
const { getTrendingShows, getNewReleaseShows } = require("../services/tmdb");

const router = express.Router();

router.get("/", async (request, response, next) => {
  try {
    const { section = "trending", genre = "all" } = request.query;
    const data =
      section === "new-releases"
        ? await getNewReleaseShows(genre)
        : await getTrendingShows(genre);

    response.json({ section, genre, results: data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
