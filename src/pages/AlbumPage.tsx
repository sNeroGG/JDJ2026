import { useEffect, useRef, useState } from "react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import type { AlbumPhoto } from "../data/defaultContent";
import { thumbSrc } from "../utils/images";
import "./AlbumPage.css";

const PAGE_SIZE = 12;

export function AlbumPage() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { album, site } = content;
  const photos = album.images.filter((item) => item.src);
  const [open, setOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = photos.slice(0, visible);

  useSeo({
    title: `${album.title} · ${site.name} ${site.year}`,
    description: album.lead || site.metaDescription,
    path: "/recuerdos",
    siteUrl: site.url,
    image: photos[0]?.src || site.ogImage,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app">
      <Navbar />
      <main>
        <section className="section album-page" ref={ref}>
          <div className="section__inner">
            {album.shareUrl ? (
              <div className="album-page__share reveal">
                <p className="section__eyebrow">
                  {album.shareEyebrow || "Álbum compartido"}
                </p>
                <h2>{album.shareTitle || "¡Participa agregando tus fotos!"}</h2>
                {album.shareLead ? <p>{album.shareLead}</p> : null}
                <a
                  className="album-page__share-cta"
                  href={album.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {album.shareCta || "Abrir álbum compartido"}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : null}
            <div className="album-page__intro reveal">
              <p className="section__eyebrow">{album.eyebrow}</p>
              <h1 className="section__title">{album.title}</h1>
              {album.lead ? <p className="section__lead">{album.lead}</p> : null}
            </div>
            {photos.length ? (
              <>
                <div className="album-page__grid reveal">
                  {shown.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      className="album-polaroid"
                      onClick={() => setOpen(index)}
                    >
                      <span className="album-polaroid__photo">
                        <img
                          src={thumbSrc(photo.src)}
                          alt={
                            photo.alt ||
                            photo.caption ||
                            `Recuerdo de Jayaque, foto ${index + 1}`
                          }
                          width={480}
                          height={480}
                          sizes="(max-width: 640px) 50vw, 184px"
                          loading={index < 4 ? "eager" : "lazy"}
                          decoding="async"
                          onError={(event) => {
                            if (event.currentTarget.src !== photo.src) {
                              event.currentTarget.src = photo.src;
                            }
                          }}
                        />
                      </span>
                      <span
                        className={`album-polaroid__caption${photo.caption ? "" : " is-blank"}`}
                      >
                        {photo.caption || "\u00a0"}
                      </span>
                    </button>
                  ))}
                </div>
                {visible < photos.length ? (
                  <button
                    type="button"
                    className="album-page__more"
                    onClick={() => setVisible((count) => count + PAGE_SIZE)}
                  >
                    Ver más fotos ({photos.length - visible})
                  </button>
                ) : null}
              </>
            ) : (
              <div className="album-page__empty reveal">
                <span>Álbum</span>
                <h2>{album.emptyTitle}</h2>
                <p>{album.emptyText}</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      {open != null && photos[open] ? (
        <AlbumLightbox
          photos={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function AlbumLightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: AlbumPhoto[];
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const total = photos.length;
  const current = photos[index];
  const touchStart = useRef<number | null>(null);

  function go(delta: number) {
    if (total < 2) return;
    onIndex((index + delta + total) % total);
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (total < 2) return;
      if (event.key === "ArrowRight") onIndex((index + 1) % total);
      if (event.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onClose, onIndex]);

  return (
    <div
      className="album-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={current.caption || current.alt || "Foto del álbum"}
    >
      <button
        type="button"
        className="album-lightbox__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="album-lightbox__card"
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start == null || end == null) return;
          const delta = end - start;
          if (delta > 40) go(-1);
          if (delta < -40) go(1);
        }}
      >
        <p className="album-lightbox__eyebrow">
          {total > 1 ? `${index + 1} / ${total}` : "Foto"}
        </p>
        <div className="album-lightbox__stage">
          <img
            src={current.src}
            alt={
              current.alt ||
              current.caption ||
              `Recuerdo de Jayaque, foto ${index + 1}`
            }
          />
          {total > 1 ? (
            <>
              <button
                type="button"
                className="album-lightbox__nav is-prev"
                aria-label="Foto anterior"
                onClick={() => go(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="album-lightbox__nav is-next"
                aria-label="Foto siguiente"
                onClick={() => go(1)}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
        {current.caption ? <p className="album-lightbox__caption">{current.caption}</p> : null}
        <button type="button" className="album-lightbox__close" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
