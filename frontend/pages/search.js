import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import ShowCard from "@/components/ShowCard";

export default function SearchPage() {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q : "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !query.trim()) {
      setResults([]);
      return;
    }

    let active = true;

    async function search() {
      try {
        setLoading(true);
        setError("");
        const data = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => {
          if (!r.ok) throw new Error("Search failed");
          return r.json();
        });
        if (active) setResults(data.results || []);
      } catch {
        if (active) setError("Search failed. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    search();
    return () => { active = false; };
  }, [query, router.isReady]);

  return (
    <>
      <Head>
        <title>{query ? `"${query}" — KDrop` : "Search — KDrop"}</title>
      </Head>

      <main className="shell">
        <div className="page-header">
          <span className="eyebrow">Search</span>
          <h1>Find a drama</h1>
        </div>

        <SearchBar initialValue={query} />

        {error && (
          <p className="status-msg error" style={{ marginTop: "1.5rem" }}>{error}</p>
        )}

        <div style={{ marginTop: "2rem" }}>
          {!query ? (
            <p className="status-msg">Enter a drama title above to search.</p>
          ) : loading ? (
            <p className="status-msg">Searching for &quot;{query}&quot;...</p>
          ) : results.length === 0 ? (
            <p className="status-msg">No Korean dramas found for &quot;{query}&quot;.</p>
          ) : (
            <>
              <div className="section-title" style={{ marginBottom: "1.25rem" }}>
                <h2>{results.length} results for &quot;{query}&quot;</h2>
              </div>
              <div className="show-grid">
                {results.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
