const express = require("express");
const { discoverShows } = require("../services/tmdb");

const router = express.Router();

router.get("/", async (request, response, next) => {
  try {
    const { page = "1", genre = "all" } = request.query;
    const data = await discoverShows(page, genre);
    response.json({ genre, ...data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;