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
  const profileSlug = profile?.username || user?.id?.slice(0, 8);

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          K<span>Drop</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/discover" className="nav-link">All Dramas</Link>
          <Link href="/search?q=" className="nav-link">Search</Link>
          {user && profileSlug && (
            <Link href={`/profile/${profileSlug}`} className="nav-link">My List</Link>
          )}
        </div>

        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search dramas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search Korean dramas"
          />
        </form>

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