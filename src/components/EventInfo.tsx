import { useReveal } from "../hooks/useReveal";
import "./EventInfo.css";

const INFO = [
  {
    label: "Qué es",
    title: "Jornada Diocesana de la Juventud",
    text: "Un espacio de encuentro, oración, formación y envío para los jóvenes de la Arquidiócesis de San Salvador.",
  },
  {
    label: "Lema 2026",
    title: "Tengan valor y síganme",
    text: "Una invitación a caminar con decisión detrás de Cristo, con la comunidad y con el corazón abierto a la misión.",
  },
  {
    label: "Para quién",
    title: "Juventud arquidiocesana",
    text: "Adolescentes y jóvenes de las 17 vicarias, grupos parroquiales, movimientos y comunidades eclesiales.",
  },
  {
    label: "Cómo prepararte",
    title: "Camina con tu parroquia",
    text: "Mantente atento a las convocatorias de tu Pastoral Juvenil parroquial y vicarial. Pronto compartiremos fechas e inscripción.",
  },
] as const;

export function EventInfo() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section event" id="evento" ref={ref}>
      <div className="section__inner">
        <div className="event__intro reveal">
          <p className="section__eyebrow">El encuentro</p>
          <h2 className="section__title">Información de la JDJ 2026</h2>
          <p className="section__lead">
            Lo esencial para empezar a prepararte y acompañar este camino
            diocesano.
          </p>
        </div>

        <div className="event__list">
          {INFO.map((item, index) => (
            <article
              key={item.label}
              className={`event__item reveal reveal-delay-${(index % 4) + 1}`}
            >
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
