const express = require("express");
const { getShowDetails } = require("../services/tmdb");

const router = express.Router();

router.get("/:id", async (request, response, next) => {
  try {
    const result = await getShowDetails(request.params.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
