import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SearchBar({ initialValue = "" }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  useEffect(() => setQuery(initialValue), [initialValue]);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        className="input"
        placeholder="Search Korean dramas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search"
      />
      <button type="submit" className="btn btn-accent">Search</button>
    </form>
  );
}
