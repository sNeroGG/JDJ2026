import type { CSSProperties } from "react";
import { Countdown } from "./Countdown";
import { SiteLink } from "./SiteLink";
import { useContent } from "../context/ContentContext";
import { formatEventDateCompact } from "../utils/dates";
import "./Hero.css";

const DATE_HIGHLIGHT_IDS = new Set(["fecha", "preparacion"]);

export function Hero() {
  const { content } = useContent();
  const { hero, logoUrl, schedule } = content;
  const eventDate = formatEventDateCompact(
    schedule.startDate,
    schedule.dateLabel,
  );
  const photo = hero.imageUrl;
  const highlights = hero.highlights ?? [];

  return (
    <header
      className={`hero${photo ? " hero--photo" : ""}`}
      id="inicio"
      style={
        photo
          ? ({ "--hero-photo": `url(${JSON.stringify(photo)})` } as CSSProperties)
          : undefined
      }
    >
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__hills">
          <span />
          <span />
          <span />
        </div>
        <div className="hero__beads">
          {Array.from({ length: 17 }).map((_, i) => (
            <i key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      </div>

      <div className="hero__content">
        <div className="hero__logo-wrap">
          <img
            className="hero__logo"
            src={logoUrl}
            alt="JDJ Jayaque 2026 — Arquidiócesis de San Salvador"
            width={1200}
            height={689}
            fetchPriority="high"
            decoding="sync"
          />
        </div>
        <p className="hero__slogan">{hero.slogan}</p>
        <p className="hero__tagline">{hero.tagline}</p>
        <Countdown />
        {highlights.length ? (
          <ul className="hero__highlights">
            {highlights.map((item) => {
              const isDate = DATE_HIGHLIGHT_IDS.has(item.id);
              const value = isDate ? eventDate : item.value;
              const href =
                isDate || item.id === "sede" || item.id === "parroquia"
                  ? ""
                  : item.href;
              const inner = (
                <>
                  <span>{isDate ? "Fecha" : item.label}</span>
                  <strong>{value}</strong>
                </>
              );
              return (
                <li key={item.id}>
                  {href ? (
                    <SiteLink href={href}>{inner}</SiteLink>
                  ) : (
                    <div className="hero__highlight">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </header>
  );
}
