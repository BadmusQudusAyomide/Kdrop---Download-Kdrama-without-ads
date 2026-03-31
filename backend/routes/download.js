const express = require("express");
const { resolveEpisodeDownload } = require("../services/consumet");

const router = express.Router();

router.get("/", async (request, response, next) => {
  try {
    const { show = "", ep = "" } = request.query;

    if (!show.trim() || !ep) {
      const error = new Error("Both show and ep query parameters are required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await resolveEpisodeDownload(show, ep);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
