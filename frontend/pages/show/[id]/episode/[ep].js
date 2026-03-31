import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import BrandMark from "../../../../components/BrandMark";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function EpisodeDownloadPage() {
  const router = useRouter();
  const { id, ep, title } = router.query;
  const [downloadData, setDownloadData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !title || !ep) {
      return;
    }

    let active = true;

    async function resolveDownload() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/download?show=${encodeURIComponent(title)}&ep=${encodeURIComponent(ep)}`
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Download sources could not be resolved.");
        }

        if (active) {
          setDownloadData(data);
        }
      } catch (resolveError) {
        if (active) {
          setError(resolveError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    resolveDownload();

    return () => {
      active = false;
    };
  }, [ep, router.isReady, title]);

  return (
    <>
      <Head>
        <title>Episode {ep} | KDrop</title>
      </Head>

      <main className="page-shell">
        <section className="topbar compact-bar">
          <BrandMark href="/" subtitle="Episode sources" />
          <Link href={`/show/${id}`} className="inline-link">
            Back to show
          </Link>
        </section>

        <section className="subpage-hero compact">
          <span className="eyebrow">Download</span>
          <h1>{title ? `${title} Episode ${ep}` : `Episode ${ep}`}</h1>
          <p>Choose a quality and start the direct download.</p>
        </section>

        {loading ? <p className="status-card">Resolving sources...</p> : null}
        {error ? (
          <p className="status-card error">
            {error} If Consumet is unavailable, try again shortly or switch to a different episode.
          </p>
        ) : null}

        {downloadData?.downloads?.length ? (
          <div className="download-grid">
            {downloadData.downloads.map((item) => (
              <article key={item.url} className="download-card">
                <span className="eyebrow">Quality</span>
                <h2>{item.quality || "Auto"}</h2>
                <p>{item.isM3U8 ? "Streaming source" : "Direct file link"}</p>
                <a className="download-link compact" href={item.url} target="_blank" rel="noreferrer">
                  Download {item.quality || "Source"}
                </a>
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </>
  );
}
