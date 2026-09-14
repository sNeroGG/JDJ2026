import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { mapDirectionsUrl, mapEmbedUrl, mapWazeUrl } from "../utils/maps";
import { SiteLink } from "./SiteLink";
import { SEDE_TOPICS } from "../utils/sedeTopics";
import "./Location.css";

export function Location() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { location } = content;

  const embedUrl = mapEmbedUrl(location);
  const directionsUrl = mapDirectionsUrl(location);
  const wazeUrl = mapWazeUrl(location);

  return (
    <section className="section location" id="donde" ref={ref}>
      <div className="section__inner">
        <div className="location__store-banner-wrapper reveal">
          <SiteLink href="/tienda" className="location__store-banner">
            <span className="location__store-banner-badge">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Tienda Oficial</span>
            </span>
            <span className="location__store-banner-text">
              Ya puedes ver las camisas oficiales de la JDJ 2026
            </span>
            <svg
              className="location__store-banner-arrow"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </SiteLink>
        </div>

        <div className="location__grid">
          <div className="location__copy reveal">
            <div className="location__eyebrow-row">
            <p className="section__eyebrow">{location.eyebrow}</p>
            <span className="location__hashtag-wrap">
              <SiteLink
                href="#todosxtodos"
                className="location__hashtag"
                aria-describedby="location-listen-hint"
              >
                #TodosPorTodos
              </SiteLink>
              <span className="location__listen" id="location-listen-hint">
                <svg
                  className="location__listen-arrow"
                  viewBox="0 0 56 20"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M54 10c-14-7-26-7-42 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 3 8 10l14 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Escucha esto :)
              </span>
            </span>
          </div>
          <h2 className="section__title">{location.title}</h2>
          <p className="section__lead">{location.lead}</p>
          <nav className="location__hubs" aria-label="Apartados de la sede">
            {SEDE_TOPICS.map((topic) => (
              <SiteLink
                key={topic.path}
                href={topic.path}
                className="location__hub"
              >
                {topic.title}
              </SiteLink>
            ))}
          </nav>
        </div>

        <div className="location__panel reveal reveal-delay-1">
          <div className="location__place">
            <span className="location__label">{location.parishLabel}</span>
            <strong>{location.parishName}</strong>
            <span>{location.placeLine}</span>
          </div>
          <p className="location__note">{location.note}</p>
          <ul className="location__facts">
            {location.facts.map((fact) => (
              <li key={fact.id}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </li>
            ))}
          </ul>
        </div>

        {embedUrl ? (
          <div className="location__map reveal reveal-delay-2">
            <div className="location__map-frame">
              <iframe
                title={`Mapa de ${location.parishName}`}
                src={embedUrl}
                loading="eager"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="location__map-actions">
              {directionsUrl ? (
                <a
                  className="location__map-link"
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {location.directionsLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              {wazeUrl ? (
                <a
                  className="location__map-link"
                  href={wazeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {location.wazeLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  </section>
);
}
