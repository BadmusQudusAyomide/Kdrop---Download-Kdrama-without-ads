import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import ShowCard from "@/components/ShowCard";

const GENRES = [
  { label: "All", value: "all" },
  { label: "Romance", value: "romance" },
  { label: "Thriller", value: "thriller" },
  { label: "Historical", value: "historical" },
  { label: "Comedy", value: "comedy" },
];

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [genre, setGenre] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [t, n] = await Promise.all([
          fetch(`/api/trending?genre=${genre}`).then((r) => {
            if (!r.ok) throw new Error("Failed");
            return r.json();
          }),
          fetch(`/api/trending?section=new-releases&genre=${genre}`).then((r) => {
            if (!r.ok) throw new Error("Failed");
            return r.json();
          }),
        ]);
        if (!active) return;
        setTrending(t.results || []);
        setNewReleases(n.results || []);
      } catch {
        if (active) setError("Failed to load dramas. Please refresh.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [genre]);

  return (
    <>
      <Head>
        <title>KDrop - Track Korean Dramas</title>
        <meta
          name="description"
          content="Discover trending Korean dramas, track your watchlist, and rate what you love."
        />
      </Head>

      <main className="shell">
        <section className="home-hero">
          <div className="home-hero-text">
            <span className="eyebrow">Your Korean Drama Hub</span>
            <h1>
              Discover. Track.<br />
              <span className="hero-accent">Fall in love again.</span>
            </h1>
            <p className="home-hero-sub">
              Explore trending titles, filter by mood, and build your personal watchlist — all in one place.
            </p>
            <div className="home-hero-actions">
              <Link href="/discover" className="btn btn-accent btn-lg">Browse All Dramas</Link>
              <Link href="/search?q=" className="btn btn-ghost btn-lg">Search</Link>
            </div>
          </div>

          <div className="home-hero-visual">
            {loading ? (
              <div className="skeleton hero-featured-skeleton" />
            ) : trending[0]?.poster ? (
              <Link href={`/show/${trending[0].id}`} className="hero-featured-card">
                <img
                  className="hero-featured-img"
                  src={trending[0].poster}
                  alt={trending[0].title}
                />
                <div className="hero-featured-overlay">
                  <span className="hero-featured-badge">Trending #1</span>
                  <div className="hero-featured-title">{trending[0].title}</div>
                  {trending[0].vote_average > 0 && (
                    <div className="hero-featured-rating">
                      ★ {trending[0].vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="genre-section">
          <div className="section-title">
            <h2>Browse by Genre</h2>
          </div>
          <div className="chip-row">
            {GENRES.map((g) => (
              <button
                key={g.value}
                className={`chip ${genre === g.value ? "active" : ""}`}
                onClick={() => setGenre(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="status-msg error" style={{ marginTop: "1.5rem" }}>{error}</p>}

        <section className="section-block">
          <div className="section-title">
            <h2>Trending Now</h2>
            <Link href="/discover" className="link-gold">See all →</Link>
          </div>
          {loading ? (
            <p className="status-msg">Loading...</p>
          ) : trending.length === 0 ? (
            <p className="status-msg">No trending dramas found for this genre right now.</p>
          ) : (
            <div className="show-grid">
              {trending.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>

        <section className="section-block">
          <div className="section-title">
            <h2>New Releases</h2>
          </div>
          {!loading && (
            newReleases.length === 0 ? (
              <p className="status-msg">No new releases found for this genre right now.</p>
            ) : (
              <div className="show-grid">
                {newReleases.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            )
          )}
        </section>
      </main>
    </>
  );
}
