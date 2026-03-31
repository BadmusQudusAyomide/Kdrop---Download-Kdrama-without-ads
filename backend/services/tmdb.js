const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w780";

const GENRE_MAP = {
  romance: 10749,
  thriller: 9648,
  historical: 37,
  comedy: 35
};

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function tmdbFetch(path, params = {}) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw createHttpError("TMDB_API_KEY is missing from backend environment variables.", 500);
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw createHttpError(`TMDB request failed: ${body}`, response.status);
  }

  return response.json();
}

function mapShow(show) {
  return {
    id: show.id,
    title: show.name,
    overview: show.overview,
    backdrop: show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${show.backdrop_path}` : null,
    poster: show.poster_path ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` : null,
    year: show.first_air_date ? show.first_air_date.slice(0, 4) : null,
    vote_average: show.vote_average,
    first_air_date: show.first_air_date,
    genre_ids: show.genre_ids || []
  };
}

function filterKoreanShows(shows, genre) {
  const genreId = GENRE_MAP[genre];

  return shows
    .filter((show) => show.original_language === "ko")
    .filter((show) => (genreId ? show.genre_ids?.includes(genreId) : true))
    .map(mapShow);
}

async function getTrendingShows(genre = "all") {
  const data = await tmdbFetch("/trending/tv/week");
  return filterKoreanShows(data.results || [], genre).slice(0, 18);
}

async function getNewReleaseShows(genre = "all") {
  const data = await tmdbFetch("/discover/tv", {
    include_null_first_air_dates: false,
    language: "en-US",
    sort_by: "first_air_date.desc",
    "vote_count.gte": 5,
    with_original_language: "ko"
  });

  return filterKoreanShows(data.results || [], genre).slice(0, 18);
}

async function searchShows(query) {
  const data = await tmdbFetch("/search/tv", {
    query,
    include_adult: false,
    language: "en-US"
  });

  return filterKoreanShows(data.results || [], "all");
}

async function getShowDetails(id) {
  const [details, credits] = await Promise.all([
    tmdbFetch(`/tv/${id}`, { language: "en-US" }),
    tmdbFetch(`/tv/${id}/credits`, { language: "en-US" })
  ]);

  const seasons = await Promise.all(
    (details.seasons || [])
      .filter((season) => season.season_number > 0)
      .map(async (season) => {
        const seasonData = await tmdbFetch(`/tv/${id}/season/${season.season_number}`, {
          language: "en-US"
        });

        return {
          id: season.id,
          name: season.name,
          season_number: season.season_number,
          episode_count: season.episode_count,
          episodes: (seasonData.episodes || []).map((episode) => ({
            id: episode.id,
            episode_number: episode.episode_number,
            name: episode.name,
            overview: episode.overview,
            runtime: episode.runtime,
            air_date: episode.air_date
          }))
        };
      })
  );

  return {
    id: details.id,
    title: details.name,
    overview: details.overview,
    backdrop: details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${details.backdrop_path}` : null,
    poster: details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : null,
    first_air_date: details.first_air_date,
    vote_average: details.vote_average,
    genres: details.genres || [],
    number_of_seasons: details.number_of_seasons,
    cast: (credits.cast || []).slice(0, 6).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character
    })),
    seasons
  };
}

module.exports = {
  getTrendingShows,
  getNewReleaseShows,
  getShowDetails,
  searchShows
};
