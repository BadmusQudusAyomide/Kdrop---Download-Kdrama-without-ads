import Link from "next/link";

export default function ShowCard({ show }) {
  return (
    <Link href={`/show/${show.id}`} className="show-card">
      <div className="show-poster-wrap">
        {show.poster ? (
          <img className="show-poster" src={show.poster} alt={`${show.title} poster`} />
        ) : (
          <div className="show-poster placeholder">No Poster</div>
        )}
      </div>
      <div className="show-card-copy">
        <span className="card-tag">Series</span>
        <h3>{show.title}</h3>
        <p>{show.overview || "Explore seasons, episodes, and cast details."}</p>
        <div className="show-card-meta">
          <span>{show.year || "TBA"}</span>
          <span>{show.vote_average ? `${show.vote_average.toFixed(1)} / 10` : "Unrated"}</span>
        </div>
      </div>
    </Link>
  );
}
