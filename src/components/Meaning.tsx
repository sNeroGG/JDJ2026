import { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import "./Meaning.css";

const ELEMENTS = [
  {
    id: "eucaristia",
    title: "Eucaristía y mosaico",
    accent: "orange",
    summary: "Centro de la vida cristiana",
    body: "Los rayos naranja y amarillo evocan la Eucaristía como centro de la vida cristiana y fuente de la misión de la Iglesia. Los tonos cálidos también recuerdan la presencia del Espíritu Santo.",
  },
  {
    id: "cielo",
    title: "Cielo y esperanza",
    accent: "sky",
    summary: "Mirada puesta en Dios",
    body: "El azul claro del cielo representa la esperanza, la trascendencia y la invitación a elevar la mirada hacia Dios en el camino de fe de cada joven.",
  },
  {
    id: "cupula",
    title: "Cúpula de San Cristóbal",
    accent: "teal",
    summary: "Iglesia que acoge",
    body: "La cúpula representa la Parroquia San Cristóbal de Jayaque, sede del encuentro, y simboliza a la Iglesia que abre sus puertas para recibir a la juventud.",
  },
  {
    id: "caminos",
    title: "Caminos de Jayaque",
    accent: "green",
    summary: "Geografía y peregrinación",
    body: "Las ondas verdes evocan las montañas de Jayaque y el camino del peregrino: un recorrido que no siempre es fácil y que pide valor para seguir a Cristo.",
  },
  {
    id: "rosario",
    title: "Cuentas del Rosario",
    accent: "navy",
    summary: "17 vicarias unidas",
    body: "Las 17 cuentas blancas representan el Santo Rosario que acompaña a los jóvenes y, a la vez, las 17 vicarias que conforman la Arquidiócesis de San Salvador.",
  },
] as const;

export function Meaning() {
  const ref = useReveal<HTMLElement>();
  const [active, setActive] = useState<string>(ELEMENTS[0].id);
  const current = ELEMENTS.find((item) => item.id === active) ?? ELEMENTS[0];

  return (
    <section className="section meaning" id="significado" ref={ref}>
      <div className="section__inner">
        <div className="meaning__intro reveal">
          <p className="section__eyebrow">Identidad</p>
          <h2 className="section__title">Significado del logo</h2>
          <p className="section__lead">
            Cada elemento cuenta una parte del mensaje: Eucaristía, Iglesia,
            camino y unidad diocesana.
          </p>
        </div>

        <div className="meaning__layout">
          <div className="meaning__visual reveal reveal-delay-1">
            <img
              src="/images/logo-principal.png"
              alt="Emblema JDJ Jayaque 2026"
            />
            <p className="meaning__quote">“Tengan valor y síganme”</p>
          </div>

          <div className="meaning__explorer reveal reveal-delay-2">
            <div className="meaning__tabs" role="tablist" aria-label="Elementos del logo">
              {ELEMENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active === item.id}
                  className={`meaning__tab meaning__tab--${item.accent} ${
                    active === item.id ? "is-active" : ""
                  }`}
                  onClick={() => setActive(item.id)}
                >
                  <span>{item.title}</span>
                  <small>{item.summary}</small>
                </button>
              ))}
            </div>

            <article
              key={current.id}
              className={`meaning__detail meaning__detail--${current.accent}`}
              role="tabpanel"
            >
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
