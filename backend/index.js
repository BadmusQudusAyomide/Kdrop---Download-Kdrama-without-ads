const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

const trendingRoute = require("./routes/trending");
const searchRoute = require("./routes/search");
const showRoute = require("./routes/show");
const downloadRoute = require("./routes/download");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "kdrama-backend" });
});

app.use("/api/trending", trendingRoute);
app.use("/api/search", searchRoute);
app.use("/api/show", showRoute);
app.use("/api/download", downloadRoute);

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    error: error.message || "Unexpected server error."
  });
});

app.listen(port, () => {
  console.log(`KDrama backend listening on port ${port}`);
});
