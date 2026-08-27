import { SiteLink } from "./SiteLink";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import type { MemoryPhoto } from "../data/defaultContent";
import "./AboutJdj.css";

function PhotoGrid({
  photos,
  fallbackAlt,
}: {
  photos: MemoryPhoto[];
  fallbackAlt: (index: number) => string;
}) {
  return (
    <div className="memories__grid reveal" data-count={photos.length}>
      {photos.map((photo, index) => (
        <figure key={photo.id} className="memories__item">
          <img
            src={photo.src}
            alt={photo.alt || fallbackAlt(index)}
            loading="lazy"
            decoding="async"
          />
        </figure>
      ))}
    </div>
  );
}

export function AboutJdj() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { about, memories, destination } = content;
  const photos = memories.images.filter((item) => item.src).slice(0, 5);
  const destinationPhotos = destination.images
    .filter((item) => item.src)
    .slice(0, 5);

  if (
    !about.title &&
    !about.body &&
    !photos.length &&
    !destination.title &&
    !destinationPhotos.length
  ) {
    return null;
  }

  return (
    <section className="section about-jdj" id="jdj" ref={ref}>
      <div className="section__inner">
        {about.title || about.body ? (
          <div className="about-jdj__intro reveal">
            <p className="section__eyebrow">{about.eyebrow}</p>
            <h2 className="section__title">{about.title}</h2>
            {about.lead ? <p className="section__lead">{about.lead}</p> : null}
            {about.body ? <p className="about-jdj__body">{about.body}</p> : null}
          </div>
        ) : null}

        {memories.title || photos.length ? (
          <div className="memories__block" id="suchitoto">
            <div className="memories__intro reveal">
              {memories.eyebrow ? (
                <p className="section__eyebrow">{memories.eyebrow}</p>
              ) : null}
              <h2 className="section__title">{memories.title}</h2>
              {memories.lead ? (
                <p className="section__lead">{memories.lead}</p>
              ) : null}
            </div>
            {photos.length ? (
              <PhotoGrid
                photos={photos}
                fallbackAlt={(index) =>
                  `Encuentro JDJ Suchitoto 2024, foto ${index + 1}`
                }
              />
            ) : null}
          </div>
        ) : null}

        {destination.title || destinationPhotos.length ? (
          <div className="memories__block destination-block" id="jayaque">
            <div className="memories__intro reveal">
              <p className="section__eyebrow">{destination.eyebrow}</p>
              <h2 className="section__title destination__hashtag">
                {destination.title}
              </h2>
              {destination.lead ? (
                <p className="section__lead">{destination.lead}</p>
              ) : null}
            </div>
            {destinationPhotos.length ? (
              <PhotoGrid
                photos={destinationPhotos}
                fallbackAlt={(index) =>
                  `Jayaque, sede de la JDJ 2026, foto ${index + 1}`
                }
              />
            ) : null}
          </div>
        ) : null}

        <div className="about-jdj__album reveal">
          <svg
            className="about-jdj__camera"
            viewBox="0 0 32 32"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
              d="M6.2 10.2h3.1l1.5-2.4h10.4l1.5 2.4h3.1A2.3 2.3 0 0 1 28.1 12.5v11.2a2.3 2.3 0 0 1-2.3 2.3H6.2a2.3 2.3 0 0 1-2.3-2.3V12.5a2.3 2.3 0 0 1 2.3-2.3Z"
            />
            <circle
              cx="16"
              cy="18.1"
              r="4.35"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <circle cx="23.4" cy="13.15" r="0.95" fill="currentColor" />
          </svg>
          <div className="about-jdj__album-copy">
            <p>
              El álbum de Jayaque vive en su propia página, con polaroids para
              recorrer las fotos.
            </p>
            <SiteLink className="about-jdj__album-cta" href="/recuerdos">
              Ver álbum de recuerdos
            </SiteLink>
          </div>
        </div>
      </div>
    </section>
  );
}
