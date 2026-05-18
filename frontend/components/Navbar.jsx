import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";
  const profileSlug = profile?.username ?? null;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          K<span>Drop</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/discover" className="nav-link">All Dramas</Link>
          {user && profileSlug && (
            <Link href={`/profile/${profileSlug}`} className="nav-link">My List</Link>
          )}
        </div>

        <div className="nav-search">
          <form className="nav-search-form" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search dramas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search Korean dramas"
            />
            <button type="submit" className="nav-search-btn" aria-label="Submit search">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <line x1="13" y1="13" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              {profileSlug && (
                <Link href={`/profile/${profileSlug}`} className="nav-avatar" title="Your profile">
                  {avatar ? <img src={avatar} alt="profile" /> : initial}
                </Link>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button className="btn btn-accent btn-sm" onClick={handleSignIn}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
