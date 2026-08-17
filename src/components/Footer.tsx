import { useContent } from "../context/ContentContext";
import "./Footer.css";

export function Footer() {
  const { content } = useContent();
  const { footer, logoUrl, hero, site } = content;

  return (
    <footer className="footer" id="contacto">
      <div className="footer__inner">
        <div className="footer__brand">
          <img
            src={logoUrl}
            alt={`${site.name} ${site.year}`}
            className="footer__logo"
          />
          <p className="footer__slogan">{hero.slogan}</p>
          <p className="footer__org">{footer.org}</p>
        </div>

        <nav className="footer__nav" aria-label="Secciones">
          <p>{footer.exploreLabel}</p>
          <ul>
            {footer.nav.map((item) => (
              <li key={item.id}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__social">
          <p>{footer.socialLabel}</p>
          <ul>
            {footer.social.map((item) => (
              <li key={item.id}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <strong>{item.name}</strong>
                  <span>{item.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <span>{footer.bottomLeft}</span>
        <span>{footer.bottomRight}</span>
      </div>
    </footer>
  );
}
