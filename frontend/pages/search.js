import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import ShowCard from "../components/ShowCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

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

    async function searchShows() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Search failed. Please try again.");
        }

        const data = await response.json();

        if (active) {
          setResults(data.results || []);
        }
      } catch (searchError) {
        if (active) {
          setError(searchError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    searchShows();

    return () => {
      active = false;
    };
  }, [query, router.isReady]);

  return (
    <>
      <Head>
        <title>Search | KDrop</title>
      </Head>

      <main className="page-shell">
        <section className="subpage-hero">
          <span className="eyebrow">Search</span>
          <h1>Find Korean dramas by title.</h1>
          <SearchBar initialValue={query} />
        </section>

        {error ? <p className="status-card error">{error}</p> : null}

        {!query ? (
          <p className="status-card">Search for a drama title to see results.</p>
        ) : loading ? (
          <p className="status-card">Searching for "{query}"...</p>
        ) : (
          <>
            <div className="section-header">
              <div>
                <span className="eyebrow">Results</span>
                <h2>{results.length} dramas found</h2>
              </div>
            </div>
            <div className="show-grid">
              {results.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
