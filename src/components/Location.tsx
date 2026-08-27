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
      <div className="section__inner location__grid">
        <div className="location__copy reveal">
          <div className="location__eyebrow-row">
            <p className="section__eyebrow">{location.eyebrow}</p>
            <SiteLink
              href="#todosxtodos"
              className="location__hashtag"
            >
              #TodosPorTodos
            </SiteLink>
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
    </section>
  );
}
