import { useAuth } from "@/lib/auth-context";

export default function EpisodeList({ showId, season, onTrack }) {
  const { user } = useAuth();

  if (!season?.episodes?.length) {
    return <p className="status-msg">No episodes available for this season.</p>;
  }

  return (
    <div className="episode-list">
      {season.episodes.map((ep) => (
        <div key={ep.id} className="episode-card">
          <div className="ep-number">{ep.episode_number}</div>
          <div className="ep-info">
            <div className="ep-title">
              {ep.name || `Episode ${ep.episode_number}`}
            </div>
            <div className="ep-meta">
              {ep.air_date && <span>{ep.air_date}</span>}
              {ep.runtime && <span>{ep.runtime} min</span>}
            </div>
          </div>
          {user && (
            <div className="ep-status">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onTrack?.(ep.episode_number)}
                title="Mark as watched"
              >
                + Track
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
