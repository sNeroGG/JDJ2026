import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { SiteLink } from "./SiteLink";
import "./Ministerios.css";

export function Ministerios() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const ministries = content.ministries;
  const photosMode = content.ministriesLayout === "photos";

  return (
    <section className="section ministerios" ref={ref}>
      <div className="section__inner ministerios__inner">
        <div className="ministerios__intro reveal">
          <h1 className="section__title">Ministerios</h1>
        </div>

        {ministries.length ? (
          <div className="ministerios__list">
            {ministries.map((item, index) => {
              const showPhoto = photosMode && Boolean(item.photo);
              const showHeroLogo = !photosMode && Boolean(item.image);
              const showSmallLogo = photosMode && Boolean(item.image);

              return (
                <article
                  key={item.id}
                  className={`ministerios__card ministerios__card--${photosMode ? "photos" : "logo"} reveal${index ? ` reveal-delay-${Math.min(index, 2)}` : ""}`}
                >
                  {showPhoto ? (
                    <div className="ministerios__photo">
                      <img
                        src={item.photo}
                        alt={`Foto de ${item.title}`}
                        width={960}
                        height={600}
                        decoding="async"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  {showHeroLogo ? (
                    <div
                      className={`ministerios__photo ministerios__photo--logo${item.keepBackground ? " has-bg" : ""}`}
                    >
                      <img
                        src={item.image}
                        alt={`Logo de ${item.title}`}
                        width={640}
                        height={640}
                        decoding="async"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div
                    className={`ministerios__copy${showSmallLogo ? "" : " ministerios__copy--text"}`}
                  >
                    {showSmallLogo ? (
                      <div
                        className={`ministerios__logo${item.keepBackground ? " has-bg" : ""}`}
                      >
                        <img
                          src={item.image}
                          alt={`Logo de ${item.title}`}
                          width={96}
                          height={96}
                          decoding="async"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="ministerios__text">
                      <h2>{item.title}</h2>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="ministerios__empty reveal">
            Pronto presentaremos los ministerios que acompañan la jornada.
          </p>
        )}

        <SiteLink className="ministerios__back" href="#donde">
          Volver a Sede
        </SiteLink>
      </div>
    </section>
  );
}
