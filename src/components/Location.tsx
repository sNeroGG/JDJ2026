import { useState } from "react";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { mapDirectionsUrl, mapEmbedUrl, mapWazeUrl } from "../utils/maps";
import "./Location.css";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Location() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { location } = content;
  const [showMap, setShowMap] = useState(false);

  const embedUrl = mapEmbedUrl(location);
  const directionsUrl = mapDirectionsUrl(location);
  const wazeUrl = mapWazeUrl(location);

  return (
    <section className="section location" id="donde" ref={ref}>
      <div className="section__inner location__grid">
        <div className="location__copy reveal">
          <p className="section__eyebrow">{location.eyebrow}</p>
          <h2 className="section__title">{location.title}</h2>
          <p className="section__lead">{location.lead}</p>
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
              {showMap ? (
                <iframe
                  title={`Mapa de ${location.parishName}`}
                  src={embedUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <button
                  type="button"
                  className="location__map-open"
                  onClick={() => setShowMap(true)}
                >
                  <span className="location__map-pin">
                    <PinIcon />
                  </span>
                  <strong>{location.mapLabel}</strong>
                  <span>{location.placeLine}</span>
                </button>
              )}
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

            {!showMap && location.mapNote ? (
              <p className="location__map-note">{location.mapNote}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
