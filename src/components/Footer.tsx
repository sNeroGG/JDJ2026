import { SiteLink } from "./SiteLink";
import { useContent } from "../context/ContentContext";
import { filterNavLinks } from "../utils/sections";
import "./Footer.css";

export function Footer() {
  const { content } = useContent();
  const { footer, hero } = content;
  const links = filterNavLinks(footer.nav, content);

  return (
    <footer className="footer" id="contacto">
      <div className="footer__inner">
        <div className="footer__brand">
          <SiteLink className="footer__logo-link" href="#inicio">
            <span className="footer__logo-disc">
              <img
                src={footer.logoUrl}
                alt={footer.org}
                className="footer__logo"
                width={240}
                height={240}
              />
            </span>
          </SiteLink>
          <p className="footer__slogan">{hero.slogan}</p>
          <p className="footer__org">{footer.org}</p>
        </div>

        <nav className="footer__nav" aria-label="Secciones">
          <p>{footer.exploreLabel}</p>
          <ul>
            {links.map((item) => (
              <li key={item.id}>
                <SiteLink href={item.href}>{item.label}</SiteLink>
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
