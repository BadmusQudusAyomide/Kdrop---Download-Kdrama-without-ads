const { MOVIES, StreamingServers } = require("@consumet/extensions");
const { extractDownloadsWithYtDlp } = require("./ytdlp");

function createHttpError(message, statusCode, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreResult(result, showTitle, year) {
  const normalizedTarget = normalizeTitle(showTitle);
  const normalizedTitle = normalizeTitle(result.title || "");
  let score = 0;

  if (normalizedTitle === normalizedTarget) {
    score += 120;
  } else if (normalizedTitle.includes(normalizedTarget)) {
    score += 80;
  } else if (normalizedTarget.includes(normalizedTitle)) {
    score += 50;
  }

  if (result.type === "TV Series") {
    score += 25;
  }

  if (year && String(result.releaseDate || "").includes(String(year))) {
    score += 15;
  }

  return score;
}

function selectBestShowMatch(results, showTitle, year) {
  return [...results]
    .sort((left, right) => scoreResult(right, showTitle, year) - scoreResult(left, showTitle, year))[0];
}

function selectEpisode(info, episodeNumber, seasonNumber) {
  const targetEpisode = Number(episodeNumber);
  const targetSeason = seasonNumber ? Number(seasonNumber) : null;

  return (info.episodes || []).find((episode) => {
    const matchesEpisode =
      Number(episode.number || episode.episodeNumber || episode.episode) === targetEpisode;

    if (!matchesEpisode) {
      return false;
    }

    if (targetSeason === null || Number.isNaN(targetSeason)) {
      return true;
    }

    return Number(episode.season) === targetSeason;
  });
}

function mapDownloads(payload) {
  const sources = payload?.sources || payload?.downloads || [];

  return sources
    .map((source) => ({
      quality: source.quality || source.label || "Source",
      url: source.url || source.file || source.link,
      isM3U8: Boolean(source.isM3U8 || String(source.url || "").includes(".m3u8"))
    }))
    .filter((item) => item.url);
}

function mapServerLinks(servers, providerName) {
  return (servers || []).map((server) => ({
    quality: `${server.name || "server"} server`,
    url: server.url,
    isM3U8: false,
    provider: providerName,
    isFallback: true
  }));
}

async function tryProvider(ProviderClass, options) {
  const provider = new ProviderClass();
  const { showTitle, episodeNumber, seasonNumber, year, serverPreference } = options;

  const searchData = await provider.search(showTitle, 1);
  const searchResults = searchData?.results || [];

  if (!searchResults.length) {
    throw createHttpError(`No match found for ${showTitle}.`, 404);
  }

  const selectedShow = selectBestShowMatch(searchResults, showTitle, year);
  const info = await provider.fetchMediaInfo(selectedShow.id);
  const episode = selectEpisode(info, episodeNumber, seasonNumber);

  if (!episode) {
    throw createHttpError(`Episode ${episodeNumber} was not found for ${showTitle}.`, 404);
  }

  const servers = await provider.fetchEpisodeServers(episode.id, info.id);
  const serverFailures = [];

  for (const preferredName of [serverPreference, ...servers.map((server) => server.name)]) {
    const server =
      servers.find((item) => String(item.name).toLowerCase() === String(preferredName).toLowerCase()) ||
      null;

    if (!server) {
      continue;
    }

    try {
      const ytDlpResult = await extractDownloadsWithYtDlp(server.url);

      if (ytDlpResult.downloads.length) {
        return {
          provider: provider.name,
          show: info.title || selectedShow.title || showTitle,
          episode: episodeNumber,
          season: seasonNumber || episode.season || null,
          downloads: ytDlpResult.downloads,
          fallbackUsed: false,
          extractor: ytDlpResult.extractor,
          serverUsed: server.name
        };
      }
    } catch (error) {
      serverFailures.push({
        step: "yt-dlp",
        server: server.name,
        message: error.message
      });
    }
  }

  try {
    const streamData = await provider.fetchEpisodeSources(
      episode.id,
      info.id,
      serverPreference
    );

    const downloads = mapDownloads(streamData);

    if (downloads.length) {
      return {
        provider: provider.name,
        show: info.title || selectedShow.title || showTitle,
        episode: episodeNumber,
        season: seasonNumber || episode.season || null,
        downloads,
        fallbackUsed: false,
        serverUsed: serverPreference
      };
    }
  } catch (error) {
    if (!servers?.length) {
      throw createHttpError(
        `Source extraction failed for ${provider.name}.`,
        502,
        { cause: error.message }
      );
    }

    serverFailures.push({
      step: "provider-extractor",
      server: serverPreference,
      message: error.message
    });
  }

  return {
    provider: provider.name,
    show: info.title || selectedShow.title || showTitle,
    episode: episodeNumber,
    season: seasonNumber || episode.season || null,
    downloads: mapServerLinks(servers, provider.name),
    fallbackUsed: true,
    message: "Direct quality extraction was blocked upstream, so server links were returned instead.",
    debug: {
      provider: provider.name,
      failures: serverFailures
    }
  };
}

async function resolveEpisodeDownload(showTitle, episodeNumber, options = {}) {
  const attempts = [
    { ProviderClass: MOVIES.FlixHQ, serverPreference: StreamingServers.VidCloud },
    { ProviderClass: MOVIES.Goku, serverPreference: StreamingServers.VidCloud },
    { ProviderClass: MOVIES.HiMovies, serverPreference: StreamingServers.MegaCloud },
    { ProviderClass: MOVIES.SFlix, serverPreference: StreamingServers.VidCloud }
  ];

  const failures = [];

  for (const attempt of attempts) {
    try {
      return await tryProvider(attempt.ProviderClass, {
        ...options,
        showTitle,
        episodeNumber,
        serverPreference: attempt.serverPreference
      });
    } catch (error) {
      failures.push(`${attempt.ProviderClass.name}: ${error.message}`);
    }
  }

  throw createHttpError(
    "No working download provider could resolve this episode right now.",
    502,
    { failures }
  );
}

module.exports = {
  resolveEpisodeDownload
};
