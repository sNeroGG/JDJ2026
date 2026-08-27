import { useReveal } from "../hooks/useReveal";
import { COMMISSIONS } from "../data/commissions";
import { SiteLink } from "./SiteLink";
import "./Comisiones.css";

export function Comisiones() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section comisiones" ref={ref}>
      <div className="section__inner comisiones__inner">
        <div className="comisiones__intro reveal">
          <h1 className="section__title">Comisiones</h1>
        </div>

        <div className="comisiones__list">
          {COMMISSIONS.map((item, index) => (
            <article
              key={item.id}
              className={`comisiones__card reveal${index ? ` reveal-delay-${Math.min(index, 2)}` : ""}`}
            >
              {item.image ? (
                <div className="comisiones__figure">
                  <img src={item.image} alt={item.title} />
                </div>
              ) : null}
              <div className="comisiones__copy">
                <h2>{item.title}</h2>
                {item.intro ? (
                  <p className="comisiones__lead">{item.intro}</p>
                ) : null}
                <p>{item.body}</p>
                <h3>Áreas que coordina</h3>
                <ul>
                  {item.areas.map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <SiteLink className="comisiones__back" href="#donde">
          Volver a Sede
        </SiteLink>
      </div>
    </section>
  );
}
