import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SearchBar({ initialValue = "" }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        aria-label="Search Korean dramas"
        placeholder="Search Korean dramas..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}
