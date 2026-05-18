import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function ShowCard({ show }) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleQuickAdd(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      setSaving(true);
      await supabase.from("watchlist_entries").upsert(
        {
          user_id: user.id,
          tmdb_id: show.id,
          drama_title: show.title,
          poster_url: show.poster,
          status: "plan_to_watch",
        },
        { onConflict: "user_id,tmdb_id" }
      );
      setAdded(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="show-card">
      <Link href={`/show/${show.id}`} className="show-card-link">
        <div className="show-poster-wrap">
          {show.poster ? (
            <img
              className="show-poster"
              src={show.poster}
              alt={`${show.title} poster`}
              loading="lazy"
            />
          ) : (
            <div className="show-poster-placeholder">No Poster</div>
          )}
        </div>
        <div className="show-card-info">
          <div className="show-card-title">{show.title}</div>
          <div className="show-card-meta">
            <span>{show.year || "-"}</span>
            {show.vote_average > 0 && (
              <span className="rating-badge">{show.vote_average.toFixed(1)} IMDB</span>
            )}
          </div>
        </div>
      </Link>

      <div className="show-card-actions">
        <Link href={`/show/${show.id}`} className="btn btn-outline btn-sm btn-full">
          View Details
        </Link>
        <button
          type="button"
          className={`btn btn-sm btn-full ${added ? "btn-ghost" : "btn-accent"}`}
          onClick={handleQuickAdd}
          disabled={saving}
        >
          {saving ? "Saving..." : added ? "In Your List" : "Add to List"}
        </button>
      </div>
    </article>
  );
}