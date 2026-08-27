import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SiteLink } from "./SiteLink";
import { useContent } from "../context/ContentContext";
import { filterNavLinks } from "../utils/sections";
import { isSedeTopicPath } from "../utils/sedeTopics";
import "./Navbar.css";

export function Navbar() {
  const { content } = useContent();
  const { header, site } = content;
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const solidPage =
    pathname === "/catequesis" ||
    pathname === "/donar" ||
    pathname.startsWith("/donar/") ||
    isSedeTopicPath(pathname);

  const links = filterNavLinks(header.nav, content).filter(
    (item) => item.href !== "#inicio",
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <nav
      className={`navbar${scrolled || solidPage ? " is-solid" : ""}${solidPage ? " is-page" : ""}${open ? " is-open" : ""}`}
      aria-label="Principal"
    >
      <div className="navbar__inner">
        <SiteLink className="navbar__brand" href="#inicio" onClick={closeMenu}>
          {site.name} <em>{site.year}</em>
        </SiteLink>

        <button
          type="button"
          className={`navbar__toggle${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-controls="navbar-menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          <span className="navbar__toggle-lines" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>

        <div
          id="navbar-menu"
          className={`navbar__menu${open ? " is-open" : ""}`}
        >
          <ul>
            {links.map((item) => {
              const isCta = item.href === header.ctaHref;
              const isActive =
                item.href === pathname ||
                (item.href.startsWith("/") && pathname === item.href);
              return (
                <li key={item.id}>
                  <SiteLink
                    className={`${isCta ? "is-cta" : ""}${isActive ? " is-active" : ""}`.trim()}
                    href={item.href}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </SiteLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
