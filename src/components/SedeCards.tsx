import { useReveal } from "../hooks/useReveal";
import type { SedeCardItem } from "../data/defaultContent";
import { SiteLink } from "./SiteLink";
import "./SedeCards.css";

export function SedeCards({
  title,
  lead,
  items,
  emptyText,
  hasHero,
}: {
  title: string;
  lead: string;
  items: SedeCardItem[];
  emptyText?: string;
  hasHero?: boolean;
}) {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      className={`section sede-cards${hasHero ? " has-hero" : ""}`}
      ref={ref}
    >
      <div className="section__inner sede-cards__inner">
        <div className="sede-cards__intro reveal">
          <h1 className="section__title">{title}</h1>
          {lead ? <p className="section__lead">{lead}</p> : null}
        </div>

        {items.length ? (
          <div className="sede-cards__list">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`sede-cards__card reveal${index ? ` reveal-delay-${Math.min(index, 2)}` : ""}`}
              >
                {item.image ? (
                  <div className="sede-cards__figure">
                    <img src={item.image} alt={item.title} />
                  </div>
                ) : null}
                <div className="sede-cards__copy">
                  <h2>{item.title}</h2>
                  {item.body ? <p>{item.body}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : emptyText && !lead ? (
          <p className="sede-cards__empty reveal">{emptyText}</p>
        ) : null}

        <SiteLink className="sede-cards__back" href="#donde">
          Volver a Sede
        </SiteLink>
      </div>
    </section>
  );
}
