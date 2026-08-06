import "./Hero.css";

export function Hero() {
  return (
    <header className="hero" id="inicio">
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__sun" />
        <div className="hero__rays" />
        <div className="hero__hills">
          <span />
          <span />
          <span />
        </div>
        <div className="hero__beads">
          {Array.from({ length: 17 }).map((_, i) => (
            <i key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      </div>

      <div className="hero__content">
        <img
          className="hero__logo"
          src="/images/logo-principal.png"
          alt="JDJ Jayaque 2026"
          width={720}
          height={320}
        />
        <p className="hero__slogan">Tengan valor y síganme</p>
        <p className="hero__tagline">
          Jornada Diocesana de la Juventud · Arquidiócesis de San Salvador
        </p>
        <a className="hero__cta" href="#donde">
          Descubrir el encuentro
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </header>
  );
}
