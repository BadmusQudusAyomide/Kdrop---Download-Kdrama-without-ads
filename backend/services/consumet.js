function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function consumetFetch(path, params = {}) {
  const baseUrl = process.env.CONSUMET_BASE_URL;

  if (!baseUrl) {
    throw createHttpError("CONSUMET_BASE_URL is missing from backend environment variables.", 500);
  }

  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw createHttpError(`Consumet request failed: ${body}`, response.status);
  }

  return response.json();
}

function normalizeTitle(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function selectBestShowMatch(results, showTitle) {
  const normalizedTarget = normalizeTitle(showTitle);

  return (
    results.find((item) => normalizeTitle(item.title || item.name || "").includes(normalizedTarget)) ||
    results[0]
  );
}

function selectEpisode(info, episodeNumber) {
  const targetEpisode = Number(episodeNumber);

  return (info.episodes || []).find((episode) => {
    const numberFromField = Number(episode.number || episode.episodeNumber || episode.episode);

    if (!Number.isNaN(numberFromField) && numberFromField === targetEpisode) {
      return true;
    }

    return String(episode.id || "").includes(`episode-${targetEpisode}`);
  });
}

function mapDownloads(payload) {
  const sources = payload.sources || payload.downloads || [];

  return sources
    .map((source) => ({
      quality: source.quality || source.label || "Source",
      url: source.url || source.file || source.link,
      isM3U8: Boolean(source.isM3U8 || String(source.url || "").includes(".m3u8"))
    }))
    .filter((item) => item.url);
}

async function resolveEpisodeDownload(showTitle, episodeNumber) {
  const searchData = await consumetFetch("/movies/dramacool", { query: showTitle });
  const searchResults = searchData.results || searchData;

  if (!Array.isArray(searchResults) || !searchResults.length) {
    throw createHttpError("No matching show found in Consumet.", 404);
  }

  const selectedShow = selectBestShowMatch(searchResults, showTitle);
  const info = await consumetFetch("/movies/dramacool/info", { id: selectedShow.id });
  const episode = selectEpisode(info, episodeNumber);

  if (!episode) {
    throw createHttpError(`Episode ${episodeNumber} was not found for ${showTitle}.`, 404);
  }

  const streamData = await consumetFetch("/movies/dramacool/watch", { episodeId: episode.id });
  const downloads = mapDownloads(streamData);

  if (!downloads.length) {
    throw createHttpError("Consumet returned no downloadable sources for this episode.", 404);
  }

  return {
    show: selectedShow.title || selectedShow.name || showTitle,
    episode: episodeNumber,
    downloads
  };
}

module.exports = {
  resolveEpisodeDownload
};
