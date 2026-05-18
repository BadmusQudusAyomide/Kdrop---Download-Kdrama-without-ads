import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth-context";

const STATUSES = [
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
  { key: "plan_to_watch", label: "Plan to Watch" },
  { key: "on_hold", label: "On Hold" },
  { key: "dropped", label: "Dropped" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, supabase } = useAuth();
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("watching");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!router.isReady || !username || !supabase) return;

    async function load() {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (!profileData) {
        if (user && username === user.id.slice(0, 8)) {
          const { data: ownProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

          if (ownProfile?.username) {
            router.replace(`/profile/${ownProfile.username}`);
            return;
          }
        }
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: watchData } = await supabase
        .from("watchlist_entries")
        .select("*")
        .eq("user_id", profileData.id)
        .order("updated_at", { ascending: false });

      setEntries(watchData || []);
      setLoading(false);
    }

    load();
  }, [router.isReady, username, supabase, user, router]);

  const isOwn = user?.id === profile?.id;
  const filtered = entries.filter((e) => e.status === activeTab);
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s.key, entries.filter((e) => e.status === s.key).length])
  );

  if (notFound && !loading) {
    return (
      <>
        <Head><title>Profile not found — KDrop</title></Head>
        <main className="shell">
          <p className="status-msg error">
            Profile &ldquo;@{username}&rdquo; not found.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{profile ? `@${profile.username} — KDrop` : "Profile — KDrop"}</title>
      </Head>

      <main className="shell">
        {loading ? (
          <p className="status-msg">Loading profile...</p>
        ) : (
          <>
            <div className="profile-header">
              <div className="profile-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} />
                ) : (
                  profile.username?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
                  @{profile.username}
                </h1>
                {profile.bio && (
                  <p style={{ color: "var(--text-2)", fontSize: "0.92rem" }}>
                    {profile.bio}
                  </p>
                )}
                <div className="profile-stats">
                  <div className="profile-stat">
                    <strong>{counts.completed}</strong>
                    <span>Completed</span>
                  </div>
                  <div className="profile-stat">
                    <strong>{counts.watching}</strong>
                    <span>Watching</span>
                  </div>
                  <div className="profile-stat">
                    <strong>{counts.plan_to_watch}</strong>
                    <span>Plan to Watch</span>
                  </div>
                  <div className="profile-stat">
                    <strong>{entries.length}</strong>
                    <span>Total</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="watchlist-tabs">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  className={`watchlist-tab ${activeTab === s.key ? "active" : ""}`}
                  onClick={() => setActiveTab(s.key)}
                >
                  {s.label}
                  {counts[s.key] > 0 && (
                    <span className="tab-count"> ({counts[s.key]})</span>
                  )}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="status-msg">
                {isOwn
                  ? "Nothing here yet. Go add some dramas!"
                  : `@${profile.username} hasn't added anything here.`}
              </p>
            ) : (
              <div className="watchlist-grid">
                {filtered.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/show/${entry.tmdb_id}`}
                    className="show-card"
                  >
                    <div className="show-poster-wrap">
                      {entry.poster_url ? (
                        <img
                          className="show-poster"
                          src={entry.poster_url}
                          alt={entry.drama_title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="show-poster-placeholder">No Poster</div>
                      )}
                    </div>
                    <div className="show-card-info">
                      <div className="show-card-title">{entry.drama_title}</div>
                      {entry.episodes_watched > 0 && (
                        <div className="show-card-meta">
                          <span>{entry.episodes_watched} ep watched</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
