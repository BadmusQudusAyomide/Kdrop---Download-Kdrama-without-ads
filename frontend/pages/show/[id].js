import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import BrandMark from "../../components/BrandMark";
import EpisodeList from "../../components/EpisodeList";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ShowPage() {
  const router = useRouter();
  const { id } = router.query;
  const [show, setShow] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    let active = true;

    async function loadShow() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/show/${id}`);
        if (!response.ok) {
          throw new Error("Unable to load show details.");
        }

        const data = await response.json();
        if (!active) {
          return;
        }

        setShow(data);
        setSeasonNumber(data.seasons?.[0]?.season_number || 1);
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

    loadShow();

    return () => {
      active = false;
    };
  }, [id, router.isReady]);

  const selectedSeason = useMemo(() => {
    if (!show?.seasons?.length) {
      return null;
    }

    return (
      show.seasons.find((season) => season.season_number === Number(seasonNumber)) ||
      show.seasons[0]
    );
  }, [seasonNumber, show]);

  return (
    <>
      <Head>
        <title>{show ? `${show.title} | KDrop` : "Show | KDrop"}</title>
      </Head>

      <main className="page-shell">
        <section className="topbar compact-bar">
          <BrandMark href="/" subtitle="Back to browse" />
          <Link href="/" className="inline-link">
            Home
          </Link>
        </section>

        {error ? <p className="status-card error">{error}</p> : null}

        {loading || !show ? (
          <p className="status-card">Loading show details...</p>
        ) : (
          <>
            <section
              className="show-hero"
              style={{
                backgroundImage: show.backdrop
                  ? `linear-gradient(180deg, rgba(10, 13, 18, 0.2), rgba(10, 13, 18, 0.92)), url(${show.backdrop})`
                  : undefined
              }}
            >
              <div className="show-hero-content">
                <span className="eyebrow">Series Details</span>
                <h1>{show.title}</h1>
                <p>{show.overview || "No synopsis available yet."}</p>
                <div className="meta-row">
                  <span>{show.first_air_date?.slice(0, 4) || "TBA"}</span>
                  <span>{show.vote_average ? `${show.vote_average.toFixed(1)} / 10` : "Unrated"}</span>
                  <span>{show.number_of_seasons} seasons</span>
                </div>
                <p className="cast-line">
                  Cast: {show.cast?.length ? show.cast.map((member) => member.name).join(", ") : "Not available"}
                </p>
              </div>
              <aside className="show-side-panel">
                <span className="eyebrow">Quick Snapshot</span>
                <div className="side-stat">
                  <strong>{show.seasons?.[0]?.episodes?.length || "--"}</strong>
                  <span>Episodes in selected catalog</span>
                </div>
                <div className="side-stat">
                  <strong>{show.cast?.length || "--"}</strong>
                  <span>Main cast shown</span>
                </div>
              </aside>
            </section>

            <section className="section-row">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Episodes</span>
                  <h2>Select a season</h2>
                </div>
                <div className="season-picker">
                  <span className="section-note">Choose season</span>
                  <select
                    className="season-select"
                    value={seasonNumber}
                    onChange={(event) => setSeasonNumber(event.target.value)}
                  >
                    {show.seasons.map((season) => (
                      <option key={season.id} value={season.season_number}>
                        {season.name || `Season ${season.season_number}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <EpisodeList
                showId={show.id}
                showTitle={show.title}
                showYear={show.first_air_date?.slice(0, 4)}
                season={selectedSeason}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}
