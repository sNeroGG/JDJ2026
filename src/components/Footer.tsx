import "./Footer.css";

const SOCIAL = [
  {
    name: "Instagram",
    handle: "@pjarqui_ss",
    href: "https://www.instagram.com/pjarqui_ss/",
  },
  {
    name: "Facebook",
    handle: "Pastoral Juvenil",
    href: "https://www.facebook.com/search/top/?q=Pastoral%20Juvenil%20Arquidi%C3%B3cesis%20de%20San%20Salvador",
  },
  {
    name: "YouTube",
    handle: "Arquidiócesis SS",
    href: "https://www.youtube.com/results?search_query=Arquidi%C3%B3cesis+de+San+Salvador",
  },
] as const;

const NAV = [
  { href: "#donde", label: "Sede" },
  { href: "#significado", label: "Logo" },
  { href: "#evento", label: "Evento" },
  { href: "#auspiciadores", label: "Logos" },
] as const;

export function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="footer__inner">
        <div className="footer__brand">
          <img
            src="/images/logo-principal.png"
            alt="JDJ Jayaque 2026"
            className="footer__logo"
          />
          <p className="footer__slogan">Tengan valor y síganme</p>
          <p className="footer__org">
            Pastoral Juvenil · Arquidiócesis de San Salvador
          </p>
        </div>

        <nav className="footer__nav" aria-label="Secciones">
          <p>Explorar</p>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__social">
          <p>Redes oficiales</p>
          <ul>
            {SOCIAL.map((item) => (
              <li key={item.name}>
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
        <span>JDJ Jayaque 2026</span>
        <span>Arquidiócesis de San Salvador, El Salvador</span>
      </div>
    </footer>
  );
}
