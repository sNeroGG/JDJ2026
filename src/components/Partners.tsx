import { useEffect, useRef, useState } from "react";
import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import "./Partners.css";

const ANTHEM_AUDIO = "/audio/todos-por-todos.mp3";
const ANTHEM_LINES = [
  "Que seamos todos uno como el Padre y tú sois uno",
  "Todos forofos de todos",
  "Que nos queramos siempre más",
];
const ANTHEM_TICKER = ANTHEM_LINES.join("   ·   ");

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8.2 5.6v12.8L19 12 8.2 5.6Z" />
    </svg>
  );
}

function PauseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 5.5h3.4v13H7zM13.6 5.5H17v13h-3.4z" />
    </svg>
  );
}

export function Partners() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { partners } = content;
  const hasLogos = partners.logos.length > 0;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const stop = () => setPlaying(false);
    audio.addEventListener("ended", stop);
    audio.addEventListener("pause", stop);
    return () => {
      audio.removeEventListener("ended", stop);
      audio.removeEventListener("pause", stop);
    };
  }, []);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <section className="section partners" id="auspiciadores" ref={ref}>
      <div className="section__inner partners__inner">
        <div className="partners__intro reveal">
          <p className="section__eyebrow">{partners.eyebrow}</p>
          <h2 className="section__title partners__title">{partners.title}</h2>
          {partners.lead ? (
            <p className="section__lead partners__lead">{partners.lead}</p>
          ) : null}
          <button
            type="button"
            className="partners__play"
            onClick={() => void togglePlay()}
            aria-pressed={playing}
            aria-label={playing ? "Pausar audio" : "Reproducir audio"}
          >
            {playing ? <PauseMark /> : <PlayMark />}
            <span>{playing ? "Pausar" : "Escuchar"}</span>
          </button>
          <audio
            ref={audioRef}
            src={ANTHEM_AUDIO}
            preload="metadata"
          />
        </div>

        <div className="partners__grid">
          {hasLogos
            ? partners.logos.map((logo) => (
                <div key={logo.id} className="partners__slot partners__slot--filled">
                  <img
                    src={logo.src}
                    alt={logo.name}
                    width={220}
                    height={88}
                    decoding="async"
                    loading="lazy"
                  />
                  {logo.name ? (
                    <p className="partners__name">{logo.name}</p>
                  ) : null}
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="partners__slot"
                  aria-label={`Espacio para logo ${index + 1}`}
                >
                  <span>Logo institucional {index + 1}</span>
                </div>
              ))}
        </div>

        <p className="partners__credit reveal reveal-delay-2">
          {partners.credit}
        </p>

        <div className="partners__marquee" aria-hidden="true">
          <div className="partners__marquee-track">
            <span>{ANTHEM_TICKER}</span>
            <span>{ANTHEM_TICKER}</span>
          </div>
        </div>
        <p className="sr-only">{ANTHEM_LINES.join(". ")}</p>
      </div>
    </section>
  );
}
