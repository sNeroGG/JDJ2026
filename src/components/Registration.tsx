import { useContent } from "../context/ContentContext";
import { useReveal } from "../hooks/useReveal";
import { SiteLink } from "./SiteLink";
import "./Registration.css";

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export function Registration() {
  const ref = useReveal<HTMLElement>();
  const { content } = useContent();
  const { registration } = content;

  if (!registration.steps.length && !registration.ctaHref) return null;

  return (
    <section className="section registration" id="inscripcion" ref={ref}>
      <div className="section__inner registration__grid">
        <div className="registration__copy reveal">
          <p className="section__eyebrow">{registration.eyebrow}</p>
          <h2 className="section__title">{registration.title}</h2>
          <p className="section__lead">{registration.lead}</p>

          {registration.statusLabel ? (
            <p
              className={`registration__status registration__status--${registration.status}`}
            >
              {registration.statusLabel}
            </p>
          ) : null}

          <div className="registration__actions">
            {registration.ctaHref && registration.ctaLabel ? (
              isExternal(registration.ctaHref) ? (
                <a
                  className="registration__cta"
                  href={registration.ctaHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {registration.ctaLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <SiteLink className="registration__cta" href={registration.ctaHref}>
                  {registration.ctaLabel}
                </SiteLink>
              )
            ) : null}
            {registration.secondaryHref && registration.secondaryLabel ? (
              <SiteLink
                className="registration__secondary"
                href={registration.secondaryHref}
              >
                {registration.secondaryLabel}
              </SiteLink>
            ) : null}
          </div>

          {registration.note ? (
            <p className="registration__note">{registration.note}</p>
          ) : null}
        </div>

        {registration.steps.length ? (
          <ol className="registration__steps reveal reveal-delay-2">
            {registration.steps.map((step, index) => (
              <li key={step.id}>
                <span className="registration__step-number">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
