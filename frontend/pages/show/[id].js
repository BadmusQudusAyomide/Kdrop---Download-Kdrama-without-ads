import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import EpisodeList from "@/components/EpisodeList";
import { useAuth } from "@/lib/auth-context";
import { getCached, setCached, isStale } from "@/lib/show-cache";

const STATUS_LABELS = {
  watching: "Watching",
  plan_to_watch: "Plan to Watch",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

function ShowSkeleton() {
  return (
    <div className="show-skeleton">
      <div className="skeleton show-skeleton-backdrop" />
      <div className="show-info-card show-skeleton-card">
        <div className="skeleton show-skeleton-poster" />
        <div className="show-skeleton-body">
          <div className="skeleton show-skeleton-line" style={{ width: "38%", height: "0.7rem", marginBottom: "0.7rem" }} />
          <div className="skeleton show-skeleton-line" style={{ width: "65%", height: "1.9rem", marginBottom: "0.9rem" }} />
          <div className="skeleton show-skeleton-line" style={{ width: "92%", height: "0.82rem", marginBottom: "0.4rem" }} />
          <div className="skeleton show-skeleton-line" style={{ width: "88%", height: "0.82rem", marginBottom: "0.4rem" }} />
          <div className="skeleton show-skeleton-line" style={{ width: "55%", height: "0.82rem", marginBottom: "1.3rem" }} />
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.1rem" }}>
            {[62, 52, 78, 68].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: w, height: 24, borderRadius: 999 }} />
            ))}
          </div>
          <div className="skeleton" style={{ width: 160, height: 36, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function ShowPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, supabase } = useAuth();
  const [show, setShow] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchStatus, setWatchStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!router.isReady || !id) return;
    let active = true;

    async function fetchShow(background = false) {
      if (!background) {
        setLoading(true);
        setError("");
      }
      try {
        const data = await fetch(`/api/show/${id}`).then((r) => {
          if (!r.ok) throw new Error("Failed to load");
          return r.json();
        });
        setCached(id, data);
        if (!active) return;
        setShow(data);
        if (!background) {
          setSeasonNumber(data.seasons?.[0]?.season_number ?? 1);
        }
      } catch {
        if (active && !background) setError("Unable to load show details.");
      } finally {
        if (active && !background) setLoading(false);
      }
    }

    const cached = getCached(id);
    if (cached) {
      setShow(cached.data);
      setSeasonNumber(cached.data.seasons?.[0]?.season_number ?? 1);
      setLoading(false);
      if (isStale(id)) fetchShow(true);
    } else {
      fetchShow(false);
    }

    return () => { active = false; };
  }, [id, router.isReady]);

  useEffect(() => {
    if (!id || !supabase) return;

    async function loadStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("watchlist_entries")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("tmdb_id", Number(id))
        .maybeSingle();
      setWatchStatus(data?.status ?? null);
    }

    loadStatus();
  }, [id, supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function onMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [dropdownOpen]);

  async function setStatus(status) {
    setSaveError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth/login"); return; }

    setSaving(true);
    const next = watchStatus === status ? null : status;

    try {
      if (next) {
        const { error } = await supabase.from("watchlist_entries").upsert(
          {
            user_id: session.user.id,
            tmdb_id: Number(id),
            drama_title: show.title,
            poster_url: show.poster,
            status: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,tmdb_id" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("watchlist_entries")
          .delete()
          .eq("user_id", session.user.id)
          .eq("tmdb_id", Number(id));
        if (error) throw error;
      }
      setWatchStatus(next);
    } catch (err) {
      console.error("Watchlist error:", err);
      setSaveError(err.message || "Failed to save. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  const selectedSeason = useMemo(() => {
    if (!show?.seasons?.length) return null;
    return (
      show.seasons.find((s) => s.season_number === Number(seasonNumber)) ??
      show.seasons[0]
    );
  }, [seasonNumber, show]);

  return (
    <>
      <Head>
        <title>{show ? `${show.title} — KDrop` : "Show — KDrop"}</title>
      </Head>

      <main className="shell">
        <button className="back-btn" onClick={() => router.back()}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {error && <p className="status-msg error">{error}</p>}

        {loading && !show ? (
          <ShowSkeleton />
        ) : !show ? null : (
          <>
            {show.backdrop && (
              <div className="show-backdrop">
                <img src={show.backdrop} alt={`${show.title} backdrop`} />
              </div>
            )}

            <div className="show-info-card">
              {show.poster && (
                <img
                  className="show-info-poster"
                  src={show.poster}
                  alt={show.title}
                />
              )}
              <div className="show-info-body">
                <span className="eyebrow">Korean Drama</span>
                <h1>{show.title}</h1>
                {show.tagline && (
                  <p className="show-tagline">&ldquo;{show.tagline}&rdquo;</p>
                )}
                <p className="show-overview">
                  {show.overview || "No synopsis available."}
                </p>

                <div className="meta-chips">
                  {show.first_air_date && (
                    <span className="meta-chip">{show.first_air_date.slice(0, 4)}</span>
                  )}
                  {show.vote_average > 0 && (
                    <span className="meta-chip">★ {show.vote_average.toFixed(1)}</span>
                  )}
                  <span className="meta-chip">
                    {show.number_of_seasons} season{show.number_of_seasons !== 1 ? "s" : ""}
                  </span>
                  {show.status && <span className="meta-chip">{show.status}</span>}
                  {show.genres?.map((g) => (
                    <span key={g.id} className="meta-chip">{g.name}</span>
                  ))}
                </div>

                {saveError && (
                  <p style={{ color: "var(--danger)", fontSize: "0.82rem", margin: "0.5rem 0 0" }}>
                    {saveError}
                  </p>
                )}
                <div className="watchlist-btn-wrap" ref={dropdownRef}>
                  <button
                    className={`btn watchlist-main-btn ${watchStatus ? "btn-accent" : "btn-ghost"}`}
                    onClick={() => setDropdownOpen((o) => !o)}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving…"
                      : watchStatus
                      ? `${STATUS_LABELS[watchStatus]} ▾`
                      : "+ Add to Watchlist"}
                  </button>

                  {dropdownOpen && (
                    <div className="watchlist-dropdown">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          className={`watchlist-dropdown-item ${watchStatus === key ? "active" : ""}`}
                          onClick={() => { setStatus(key); setDropdownOpen(false); }}
                        >
                          <span>{label}</span>
                          {watchStatus === key && <span className="dropdown-check">✓</span>}
                        </button>
                      ))}
                      {watchStatus && (
                        <>
                          <div className="watchlist-dropdown-divider" />
                          <button
                            className="watchlist-dropdown-item watchlist-dropdown-remove"
                            onClick={() => { setStatus(watchStatus); setDropdownOpen(false); }}
                          >
                            Remove from list
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {show.cast?.length > 0 && (
              <section className="section-block">
                <div className="section-title">
                  <h2>Cast</h2>
                </div>
                <div className="cast-grid">
                  {show.cast.map((person) => (
                    <div key={person.id} className="cast-card">
                      {person.profile ? (
                        <img
                          className="cast-photo"
                          src={person.profile}
                          alt={person.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="cast-photo-placeholder">👤</div>
                      )}
                      <div className="cast-info">
                        <div className="cast-name">{person.name}</div>
                        <div className="cast-role">{person.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="section-block">
              <div className="section-title">
                <h2>Episodes</h2>
                <select
                  className="season-select"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(Number(e.target.value))}
                >
                  {show.seasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      {s.name ?? `Season ${s.season_number}`}
                    </option>
                  ))}
                </select>
              </div>
              <EpisodeList
                showId={show.id}
                season={selectedSeason}
                onTrack={() => {
                  if (!watchStatus) setStatus("watching");
                }}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}
