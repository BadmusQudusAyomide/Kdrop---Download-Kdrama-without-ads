import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const GENRES = [
  { label: "All", value: "all" },
  { label: "Romance", value: "romance" },
  { label: "Thriller", value: "thriller" },
  { label: "Historical", value: "historical" },
  { label: "Comedy", value: "comedy" },
];

const QUICK_STATUSES = [
  { key: "plan_to_watch", label: "Plan" },
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
];

export default function DiscoverPage() {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const page = Math.max(Number(router.query.page) || 1, 1);
  const genre = typeof router.query.genre === "string" ? router.query.genre : "all";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetch(`/api/discover?page=${page}&genre=${genre}`).then((r) => {
          if (!r.ok) throw new Error("Failed to load");
          return r.json();
        });

        if (!active) return;
        setItems(data.results || []);
        setTotalPages(data.total_pages || 1);
      } catch {
        if (active) setError("Unable to load dramas right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [page, genre, router.isReady]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pageTitle = useMemo(() => {
    const found = GENRES.find((g) => g.value === genre);
    return found ? found.label : "All";
  }, [genre]);

  function setQuery(next) {
    router.push({
      pathname: "/discover",
      query: { page: String(next.page ?? page), genre: next.genre ?? genre },
    });
  }

  async function addWithStatus(show, status) {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setSavingId(`${show.id}-${status}`);
    await supabase.from("watchlist_entries").upsert(
      {
        user_id: user.id,
        tmdb_id: show.id,
        drama_title: show.title,
        poster_url: show.poster,
        status,
      },
      { onConflict: "user_id,tmdb_id" }
    );
    setSavingId(null);
  }

  return (
    <>
      <Head>
        <title>All Dramas - KDrop</title>
      </Head>

      <main className="shell">
        <div className="page-header">
          <span className="eyebrow">Browse Everything</span>
          <h1>All K-Drama Titles</h1>
          <p className="text-2">Pick a title and add it straight to your list status.</p>
        </div>

        <div className="home-panel" style={{ marginBottom: "1.25rem" }}>
          <div className="chip-row">
            {GENRES.map((g) => (
              <button
                key={g.value}
                className={`chip ${genre === g.value ? "active" : ""}`}
                onClick={() => setQuery({ genre: g.value, page: 1 })}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="status-msg error">{error}</p>}

        {loading ? (
          <p className="status-msg">Loading page {page}...</p>
        ) : (
          <>
            <div className="section-title">
              <h2>{pageTitle} Dramas</h2>
              <span className="muted">Page {page} of {totalPages}</span>
            </div>

            <div className="show-grid">
              {items.map((show) => (
                <article className="show-card" key={show.id}>
                  <Link href={`/show/${show.id}`} className="show-card-link">
                    <div className="show-poster-wrap">
                      {show.poster ? (
                        <img className="show-poster" src={show.poster} alt={`${show.title} poster`} loading="lazy" />
                      ) : (
                        <div className="show-poster-placeholder">No Poster</div>
                      )}
                    </div>
                    <div className="show-card-info">
                      <div className="show-card-title">{show.title}</div>
                      <div className="show-card-meta">
                        <span>{show.year || "-"}</span>
                        {show.vote_average > 0 && <span className="rating-badge">{show.vote_average.toFixed(1)} IMDB</span>}
                      </div>
                    </div>
                  </Link>

                  <div className="show-card-actions show-card-actions-3">
                    {QUICK_STATUSES.map((s) => (
                      <button
                        key={s.key}
                        className="btn btn-outline btn-sm"
                        disabled={savingId === `${show.id}-${s.key}`}
                        onClick={() => addWithStatus(show, s.key)}
                      >
                        {savingId === `${show.id}-${s.key}` ? "..." : s.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="discover-pagination">
              <button className="btn btn-ghost" disabled={!canPrev} onClick={() => setQuery({ page: page - 1 })}>
                Previous
              </button>
              <span className="muted">Page {page}</span>
              <button className="btn btn-ghost" disabled={!canNext} onClick={() => setQuery({ page: page + 1 })}>
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}