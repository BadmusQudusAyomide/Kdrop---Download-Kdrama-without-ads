import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "../components/BrandMark";
import SearchBar from "../components/SearchBar";
import ShowCard from "../components/ShowCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const GENRES = [
  { label: "All", value: "all" },
  { label: "Romance", value: "romance" },
  { label: "Thriller", value: "thriller" },
  { label: "Historical", value: "historical" },
  { label: "Comedy", value: "comedy" }
];

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [genre, setGenre] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHome() {
      try {
        setLoading(true);
        setError("");

        const [trendingResponse, releasesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/trending?genre=${genre}`),
          fetch(`${API_BASE_URL}/api/trending?section=new-releases&genre=${genre}`)
        ]);

        if (!trendingResponse.ok || !releasesResponse.ok) {
          throw new Error("Unable to load KDrama catalog right now.");
        }

        const [trendingData, releasesData] = await Promise.all([
          trendingResponse.json(),
          releasesResponse.json()
        ]);

        if (!active) {
          return;
        }

        setTrending(trendingData.results || []);
        setNewReleases(releasesData.results || []);
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      active = false;
    };
  }, [genre]);

  return (
    <>
      <Head>
        <title>KDrop | Discover Korean Dramas</title>
        <meta
          name="description"
          content="Clean, fast KDrama discovery with episode downloads."
        />
      </Head>

      <main className="page-shell">
        <section className="topbar">
          <BrandMark subtitle="KDrama discovery" />
          <p className="topbar-note">Clean browsing for Korean drama fans.</p>
        </section>

        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">KDrama Discovery</span>
            <h1>Find a show. Open the episodes. Download in one clean flow.</h1>
            <p>
              Browse trending Korean dramas, search instantly, and jump straight to
              episode downloads without clutter.
            </p>
            <SearchBar />
            <div className="hero-pills">
              <span>Fast search</span>
              <span>Live TMDB metadata</span>
              <span>Mobile-ready browsing</span>
            </div>
          </div>

          <div className="hero-panel">
            <p className="hero-panel-title">Now Streaming Across The Scene</p>
            <div className="hero-stats">
              <div>
                <strong>{trending.length || "--"}</strong>
                <span>Trending picks</span>
              </div>
              <div>
                <strong>{newReleases.length || "--"}</strong>
                <span>Fresh arrivals</span>
              </div>
              <div>
                <strong>KO</strong>
                <span>Language-focused catalog</span>
              </div>
            </div>
            <div className="hero-feature">
              <span className="eyebrow">Focused Experience</span>
              <p>No clutter, no ad-heavy pages, just title discovery and episode flow.</p>
            </div>
          </div>
        </section>

        <section className="section-row spotlight-row">
          <article className="spotlight-card">
            <span className="eyebrow">Tonight&apos;s Mood</span>
            <h2>Browse by vibe before you search.</h2>
            <p>
              Pick a genre and the homepage reshapes itself around romance, thrillers,
              historical stories, and lighter comfort-watch picks.
            </p>
          </article>
          <div className="section-header">
            <div>
              <span className="eyebrow">Browse</span>
              <h2>Genres</h2>
            </div>
            <div className="chip-row">
              {GENRES.map((item) => (
                <button
                  key={item.value}
                  className={`chip ${genre === item.value ? "active" : ""}`}
                  onClick={() => setGenre(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error ? <p className="status-card error">{error}</p> : null}

        <section className="section-row">
          <div className="section-header">
            <div>
              <span className="eyebrow">Right Now</span>
              <h2>Trending KDramas</h2>
            </div>
            <Link href="/search?q=" className="inline-link">
              Explore all
            </Link>
          </div>
          {loading ? (
            <p className="status-card">Loading trending dramas...</p>
          ) : (
            <div className="show-grid">
              {trending.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>

        <section className="section-row">
          <div className="section-header">
            <div>
              <span className="eyebrow">Fresh Picks</span>
              <h2>New Releases</h2>
            </div>
          </div>
          {loading ? (
            <p className="status-card">Loading new releases...</p>
          ) : (
            <div className="show-grid">
              {newReleases.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
