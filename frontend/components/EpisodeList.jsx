import Link from "next/link";

export default function EpisodeList({ showId, showTitle, season }) {
  if (!season?.episodes?.length) {
    return <p className="status-card">No episodes available for this season yet.</p>;
  }

  return (
    <div className="episode-list">
      {season.episodes.map((episode) => (
        <article key={episode.id} className="episode-card">
          <div>
            <span className="eyebrow">Episode {episode.episode_number}</span>
            <h3>{episode.name || `Episode ${episode.episode_number}`}</h3>
            <p>{episode.overview || "Episode overview not available."}</p>
          </div>

          <Link
            href={`/show/${showId}/episode/${episode.episode_number}?title=${encodeURIComponent(showTitle)}`}
            className="download-link"
          >
            Download
          </Link>
        </article>
      ))}
    </div>
  );
}
