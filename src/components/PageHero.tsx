import "./PageHero.css";

export function PageHero({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;

  return (
    <div className="page-hero">
      <img src={src} alt={alt} />
    </div>
  );
}
