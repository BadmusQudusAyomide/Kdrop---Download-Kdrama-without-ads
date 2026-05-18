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
        <section className="home-hero home-panel">
          <div>
            <span className="eyebrow">Smart K-Drama Recommendations</span>
            <h1>Find your next favorite series in minutes.</h1>
            <p className="home-hero-sub">
              Discover trending titles, filter by mood, and instantly save shows to your personal list.
            </p>
          </div>
          <div className="home-hero-cta">
            <Link href="/search?q=" className="btn btn-accent btn-lg">Explore Library</Link>
            <p>Fresh picks updated daily from TMDB.</p>
          </div>
        </section>

        <section className="home-panel">
          <div className="section-title">
            <h2>Browse By Genre</h2>
            <span className="muted">Tap a genre to refresh sections</span>
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

        {error && <p className="status-msg error">{error}</p>}

        <section className="section-block">
          <div className="section-title">
            <h2>Trending Now</h2>
            <Link href="/search?q=" className="link-gold">See all</Link>
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