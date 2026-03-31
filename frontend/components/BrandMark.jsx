import Link from "next/link";

const BRAND_LOGO_URL =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Movie-reel.svg";

function BrandContent({ subtitle }) {
  return (
    <>
      <img
        className="brand-logo"
        src={BRAND_LOGO_URL}
        alt="KDrop logo"
      />
      <div>
        <strong>KDrop</strong>
        <small>{subtitle}</small>
      </div>
    </>
  );
}

export default function BrandMark({ href, subtitle }) {
  if (href) {
    return (
      <Link href={href} className="brand-mark">
        <BrandContent subtitle={subtitle} />
      </Link>
    );
  }

  return (
    <div className="brand-mark" aria-label="KDrop">
      <BrandContent subtitle={subtitle} />
    </div>
  );
}
