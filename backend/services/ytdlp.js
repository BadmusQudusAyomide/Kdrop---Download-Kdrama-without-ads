const { spawn } = require("child_process");

function runYtDlp(url) {
  const executable = process.env.YT_DLP_PATH || "yt-dlp";
  const args = [
    "-J",
    "--no-playlist",
    "--no-warnings",
    url
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Unable to start yt-dlp: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `yt-dlp exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`yt-dlp returned invalid JSON: ${error.message}`));
      }
    });
  });
}

function normalizeQuality(format) {
  if (format.height) {
    return `${format.height}p`;
  }

  if (format.format_note) {
    return format.format_note;
  }

  if (format.resolution) {
    return format.resolution;
  }

  return format.format_id || "Source";
}

function mapYtDlpFormats(payload) {
  const formats = payload?.formats || [];
  const seen = new Set();

  return formats
    .filter((format) => format.url)
    .filter((format) => {
      const protocol = String(format.protocol || "");
      return protocol.includes("m3u8") || protocol.includes("https") || protocol.includes("http");
    })
    .map((format) => ({
      quality: normalizeQuality(format),
      url: format.url,
      isM3U8: String(format.protocol || "").includes("m3u8") || String(format.url).includes(".m3u8"),
      ext: format.ext || null
    }))
    .filter((format) => {
      const key = `${format.quality}:${format.url}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

async function extractDownloadsWithYtDlp(url) {
  const payload = await runYtDlp(url);
  const downloads = mapYtDlpFormats(payload);

  return {
    title: payload?.title || null,
    extractor: payload?.extractor || null,
    webpageUrl: payload?.webpage_url || url,
    downloads
  };
}

module.exports = {
  extractDownloadsWithYtDlp
};
