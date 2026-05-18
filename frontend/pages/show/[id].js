import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import EpisodeList from "@/components/EpisodeList";
import { useAuth } from "@/lib/auth-context";

const STATUS_LABELS = {
  watching: "Watching",
  plan_to_watch: "Plan to Watch",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

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

  useEffect(() => {
    if (!router.isReady || !id) return;
    let active = true;

    async function loadShow() {
      try {
        setLoading(true);
        const data = await fetch(`/api/show/${id}`).then((r) => {
          if (!r.ok) throw new Error("Failed to load");
          return r.json();
        });
        if (!active) return;
        setShow(data);
        setSeasonNumber(data.seasons?.[0]?.season_number ?? 1);
      } catch {
        if (active) setError("Unable to load show details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadShow();
    return () => { active = false; };
  }, [id, router.isReady]);

  useEffect(() => {
    if (!user || !id || !supabase) return;
    supabase
      .from("watchlist_entries")
      .select("status")
      .eq("user_id", user.id)
      .eq("tmdb_id", id)
      .maybeSingle()
      .then(({ data }) => setWatchStatus(data?.status ?? null));
  }, [user, id, supabase]);

  async function setStatus(status) {
    if (!user) { router.push("/auth/login"); return; }
    setSaving(true);
    const next = watchStatus === status ? null : status;
    if (next) {
      await supabase.from("watchlist_entries").upsert(
        {
          user_id: user.id,
          tmdb_id: Number(id),
          drama_title: show.title,
          poster_url: show.poster,
          status: next,
        },
        { onConflict: "user_id,tmdb_id" }
      );
    } else {
      await supabase
        .from("watchlist_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", id);
    }
    setWatchStatus(next);
    setSaving(false);
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
        {error && <p className="status-msg error">{error}</p>}

        {loading || !show ? (
          <p className="status-msg">Loading...</p>
        ) : (
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

                <div className="watchlist-actions">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      disabled={saving}
                      className={`btn btn-sm ${watchStatus === key ? "btn-accent" : "btn-ghost"}`}
                      onClick={() => setStatus(key)}
                    >
                      {label}
                    </button>
                  ))}
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
                onTrack={(epNum) => {
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
