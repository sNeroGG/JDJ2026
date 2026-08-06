import { useReveal } from "../hooks/useReveal";
import "./Location.css";

export function Location() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section location" id="donde" ref={ref}>
      <div className="section__inner location__grid">
        <div className="location__copy reveal">
          <p className="section__eyebrow">Sede 2026</p>
          <h2 className="section__title">Este año la JDJ camina hacia Jayaque</h2>
          <p className="section__lead">
            Un encuentro de fe, esperanza y comunidad en las montañas de la
            Arquidiócesis de San Salvador.
          </p>
        </div>

        <div className="location__panel reveal reveal-delay-1">
          <div className="location__place">
            <span className="location__label">Parroquia sede</span>
            <strong>Parroquia San Cristóbal</strong>
            <span>Jayaque, El Salvador</span>
          </div>
          <p className="location__note">
            La cúpula del logo evoca esta iglesia que abre sus puertas para
            acoger a la juventud diocesana. Los caminos verdes recuerdan la
            geografía montañosa del lugar y el itinerario del peregrino.
          </p>
          <ul className="location__facts">
            <li>
              <span>Municipio</span>
              <strong>Jayaque</strong>
            </li>
            <li>
              <span>Departamento</span>
              <strong>La Libertad</strong>
            </li>
            <li>
              <span>Organiza</span>
              <strong>Pastoral Juvenil Arquidiocesana</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
