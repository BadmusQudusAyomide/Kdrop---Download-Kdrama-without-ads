import Link from "next/link";

export default function EpisodeList({ showId, showTitle, showYear, season }) {
  if (!season?.episodes?.length) {
    return <p className="status-card">No episodes available for this season yet.</p>;
  }

  return (
    <div className="episode-list">
      {season.episodes.map((episode) => (
        <article key={episode.id} className="episode-card">
          <div className="episode-copy">
            <span className="eyebrow">Episode {episode.episode_number}</span>
            <h3>{episode.name || `Episode ${episode.episode_number}`}</h3>
            <p>{episode.overview || "Episode overview not available."}</p>
            <div className="episode-meta">
              <span>{episode.air_date || "Air date unavailable"}</span>
              <span>{episode.runtime ? `${episode.runtime} min` : "Runtime TBD"}</span>
            </div>
          </div>

          <Link
            href={`/show/${showId}/episode/${episode.episode_number}?title=${encodeURIComponent(showTitle)}&season=${encodeURIComponent(season.season_number)}&year=${encodeURIComponent(showYear || "")}`}
            className="download-link compact"
          >
            Download
          </Link>
        </article>
      ))}
    </div>
  );
}
