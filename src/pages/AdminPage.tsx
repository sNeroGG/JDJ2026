import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import {
  AUTH_SECRET_KEY,
  DEFAULT_CONTENT,
  type AccentTone,
  type CatechesisDoc,
  type PartnerLogo,
  type RegistrationStatus,
  type ScheduleDay,
  type SiteContent,
} from "../data/defaultContent";
import { createId, downloadJson } from "../utils/files";
import { uploadMedia } from "../utils/media";
import "./AdminPage.css";

const ACCENTS: AccentTone[] = ["orange", "sky", "teal", "green", "navy"];

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  soon: "Próximamente",
  open: "Abiertas",
  closed: "Cerradas",
};

export function AdminPage() {
  const {
    content,
    setContent,
    saveContent,
    resetContent,
    isAuthenticated,
    login,
    logout,
  } = useContent();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [section, setSection] = useState("variables");
  const [logoNotice, setLogoNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [projectDocs, setProjectDocs] = useState<{ name: string; url: string }[]>(
    [],
  );

  useEffect(() => {
    setDraft(content);
  }, [content]);

  useEffect(() => {
    if (!isAuthenticated || section !== "catechesis" || !import.meta.env.DEV) {
      return;
    }
    const password = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
    void fetch("/__admin/files", {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then(async (remote) => {
        if (!remote.ok) return;
        const payload = (await remote.json()) as {
          docs?: { name: string; url: string }[];
        };
        setProjectDocs(payload.docs ?? []);
      })
      .catch(() => {
        setProjectDocs([]);
      });
  }, [isAuthenticated, section, draft.catechesis.docs.length]);

  const partnerCount = draft.partners.logos.length;
  const docCount = draft.catechesis.docs.length;
  const dayCount = draft.schedule.days.length;
  const faqCount = draft.faq.items.length;
  const vicariateCount = draft.vicariates.items.length;
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(content),
    [draft, content],
  );

  const navItems = useMemo(
    () => [
      { id: "variables", label: "Variables", full: "Variables rápidas" },
      { id: "logo", label: "Logo", full: "Logo PNG" },
      { id: "hero", label: "Hero", full: "Hero" },
      { id: "location", label: "Sede", full: "Sede" },
      { id: "meaning", label: "Significado", full: "Significado del logo" },
      { id: "event", label: "Evento", full: "Evento" },
      {
        id: "schedule",
        label: `Agenda${dayCount ? ` (${dayCount})` : ""}`,
        full: "Fechas y agenda",
      },
      { id: "registration", label: "Inscripción", full: "Inscripción" },
      { id: "catechesis", label: `Catequesis${docCount ? ` (${docCount})` : ""}`, full: "Catequesis" },
      {
        id: "faq",
        label: `Preguntas${faqCount ? ` (${faqCount})` : ""}`,
        full: "Preguntas frecuentes",
      },
      {
        id: "vicariates",
        label: `Vicarías${vicariateCount ? ` (${vicariateCount})` : ""}`,
        full: "Vicarías",
      },
      { id: "partners", label: `Logos${partnerCount ? ` (${partnerCount})` : ""}`, full: "Logos institucionales" },
      { id: "footer", label: "Footer", full: "Menú / Footer" },
    ],
    [partnerCount, docCount, dayCount, faqCount, vicariateCount],
  );
  const currentSection =
    navItems.find((item) => item.id === section) ?? navItems[0];

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    const ok = await login(password);
    setError(ok ? "" : "Contraseña incorrecta");
    if (ok) setPassword("");
  }

  function patchSite(patch: Partial<SiteContent["site"]>) {
    setDraft({ ...draft, site: { ...draft.site, ...patch } });
  }

  function patchLocation(patch: Partial<SiteContent["location"]>) {
    setDraft({ ...draft, location: { ...draft.location, ...patch } });
  }

  function patchSchedule(patch: Partial<SiteContent["schedule"]>) {
    setDraft({ ...draft, schedule: { ...draft.schedule, ...patch } });
  }

  function patchRegistration(patch: Partial<SiteContent["registration"]>) {
    setDraft({ ...draft, registration: { ...draft.registration, ...patch } });
  }

  function patchFaq(patch: Partial<SiteContent["faq"]>) {
    setDraft({ ...draft, faq: { ...draft.faq, ...patch } });
  }

  function patchVicariates(patch: Partial<SiteContent["vicariates"]>) {
    setDraft({ ...draft, vicariates: { ...draft.vicariates, ...patch } });
  }

  function patchDay(index: number, patch: Partial<ScheduleDay>) {
    const days = [...draft.schedule.days];
    days[index] = { ...days[index], ...patch };
    patchSchedule({ days });
  }

  async function persist(next: SiteContent = draft) {
    setContent(next);
    try {
      await saveContent(next);
      setSavedAt(new Date().toLocaleTimeString("es-SV"));
      setLogoNotice("Cambios guardados en el proyecto.");
    } catch (error) {
      setLogoNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar en el proyecto.",
      );
      throw error;
    }
  }

  async function uploadOrWarn(file: File, folder: "images" | "docs") {
    try {
      setLogoNotice(`Copiando ${file.name} a public/${folder}…`);
      const uploaded = await uploadMedia(file, folder);
      setLogoNotice(`${file.name} quedó en public/${folder}.`);
      return uploaded;
    } catch (error) {
      setLogoNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el archivo. Usa npm run dev en local.",
      );
      return null;
    }
  }

  async function onMainLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOrWarn(file, "images");
      if (!uploaded) return;
      const next = { ...draft, logoUrl: uploaded.url };
      setDraft(next);
      await persist(next);
    } catch {
      // aviso ya visible
    } finally {
      setUploading(false);
    }
  }

  async function onCatechesisUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    setUploading(true);
    const uploads: CatechesisDoc[] = [];
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadOrWarn(file, "docs");
        if (!uploaded) continue;
        uploads.push({
          id: createId("doc"),
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          fileName: file.name,
          href: uploaded.url,
          coverUrl: uploaded.coverUrl,
        });
      }
      if (!uploads.length) return;
      const next = {
        ...draft,
        catechesis: {
          ...draft.catechesis,
          docs: [...draft.catechesis.docs, ...uploads],
        },
      };
      setDraft(next);
      setLogoNotice("Guardando documentos en el proyecto…");
      await persist(next);
      setLogoNotice(
        `${uploads.length} documento(s) copiados a public/docs y listos en Catequesis.`,
      );
    } catch {
      // aviso ya visible
    } finally {
      setUploading(false);
    }
  }

  async function onFooterLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOrWarn(file, "images");
      if (!uploaded) return;
      const next = {
        ...draft,
        footer: { ...draft.footer, logoUrl: uploaded.url },
      };
      setDraft(next);
      await persist(next);
    } catch {
      // aviso ya visible
    } finally {
      setUploading(false);
    }
  }

  async function onPartnerUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    setUploading(true);
    const uploads: PartnerLogo[] = [];
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadOrWarn(file, "images");
        if (!uploaded) continue;
        uploads.push({
          id: createId("logo"),
          name: file.name.replace(/\.[^.]+$/, ""),
          src: uploaded.url,
        });
      }
      if (!uploads.length) return;
      const next = {
        ...draft,
        partners: {
          ...draft.partners,
          logos: [...draft.partners.logos, ...uploads],
        },
      };
      setDraft(next);
      await persist(next);
    } catch {
      // aviso ya visible
    } finally {
      setUploading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <form className="admin-login__card" onSubmit={handleLogin}>
          <p className="admin-login__eyebrow">JDJ 2026</p>
          <h1>Panel de administración</h1>
          <p>
            En local (`npm run dev`) puedes guardar logos y documentos en el
            proyecto. Luego subes el commit a GitHub y Vercel los sirve con la
            web.
          </p>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </label>
          {error ? <p className="admin-login__error">{error}</p> : null}
          <button type="submit">Entrar</button>
          <Link to="/">← Volver a la landing</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          <strong>JDJ Admin</strong>
          <span>Panel de contenido</span>
        </div>
        <nav aria-label="Secciones del admin">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? "is-active" : ""}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin__side-actions">
          <Link to="/">Ver landing</Link>
          <button type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin__main">
        <header className="admin__top">
          <div>
            <p className="admin__eyebrow">{currentSection.full}</p>
            <h1>{currentSection.label}</h1>
            <p className="admin__lead">
              En local, Guardar escribe en el proyecto. Sube esos archivos a
              GitHub para que Vercel los publique con el sitio.
            </p>
          </div>
          <div className="admin__actions">
            {isDirty ? (
              <span className="admin__dirty">Sin guardar</span>
            ) : null}
            {savedAt ? (
              <span className="admin__saved">Guardado {savedAt}</span>
            ) : null}
            <button
              type="button"
              className="btn btn--ghost admin__action-discard"
              onClick={() => {
                setDraft(content);
                setLogoNotice("");
              }}
            >
              Descartar
            </button>
            <button
              type="button"
              className="btn btn--ghost admin__action-secondary"
              onClick={() => {
                if (confirm("¿Restablecer todo al contenido original?")) {
                  void resetContent();
                  setDraft(DEFAULT_CONTENT);
                  setSavedAt(new Date().toLocaleTimeString("es-SV"));
                }
              }}
            >
              Restablecer
            </button>
            <button
              type="button"
              className="btn btn--ghost admin__action-secondary"
              onClick={() => downloadJson("jdj2026-content.json", draft)}
            >
              Exportar
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={uploading}
              onClick={() => void persist().catch(() => undefined)}
            >
              Guardar
            </button>
          </div>
        </header>
        {uploading || logoNotice ? (
          <p
            className={`admin-notice${uploading ? " is-busy" : ""}`}
            role="status"
          >
            {uploading ? (
              <span className="admin-spinner" aria-hidden="true" />
            ) : null}
            {logoNotice || "Trabajando…"}
          </p>
        ) : null}

        {section === "variables" && (
          <section className="admin-panel">
            <h2>Variables rápidas</h2>
            <p className="admin-panel__hint">
              Accesos directos a lo más usado. El detalle completo está en cada
              sección del menú.
            </p>

            <h3>Sitio</h3>
            <div className="admin-grid">
              <label>
                Nombre del evento
                <input
                  value={draft.site.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      site: { ...draft.site, name: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Año
                <input
                  value={draft.site.year}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      site: { ...draft.site, year: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Título de la pestaña
                <input
                  value={draft.site.pageTitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      site: { ...draft.site, pageTitle: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Descripción SEO
                <input
                  value={draft.site.metaDescription}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      site: { ...draft.site, metaDescription: e.target.value },
                    })
                  }
                />
              </label>
            </div>

            <h3>Cómo se ve al compartir el enlace</h3>
            <p className="admin-panel__hint">
              WhatsApp, Facebook e Instagram leen estos datos del HTML que genera
              el build. La imagen se regenera con <code>npm run optimize:og</code>{" "}
              cuando cambies el logo.
            </p>
            <div className="admin-grid">
              <label>
                Dominio del sitio
                <input
                  value={draft.site.url}
                  onChange={(e) => patchSite({ url: e.target.value })}
                  placeholder="https://jdj2026.org"
                />
              </label>
              <label>
                Imagen para compartir (1200×630)
                <input
                  value={draft.site.ogImage}
                  onChange={(e) => patchSite({ ogImage: e.target.value })}
                  placeholder="/images/og-jdj-2026.jpg"
                />
              </label>
            </div>
            {draft.site.ogImage ? (
              <div className="admin-logo-preview">
                <img src={draft.site.ogImage} alt="Vista previa al compartir" />
              </div>
            ) : null}

            <h3>Hero</h3>
            <label>
              Lema
              <input
                value={draft.hero.slogan}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, slogan: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Texto debajo del lema
              <textarea
                rows={2}
                value={draft.hero.tagline}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, tagline: e.target.value },
                  })
                }
              />
            </label>
            <div className="admin-grid">
              <label>
                Texto del botón
                <input
                  value={draft.hero.ctaLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: { ...draft.hero, ctaLabel: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Enlace del botón
                <input
                  value={draft.hero.ctaHref}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: { ...draft.hero, ctaHref: e.target.value },
                    })
                  }
                />
              </label>
            </div>

            <h3>Sede</h3>
            <div className="admin-grid">
              <label>
                Parroquia
                <input
                  value={draft.location.parishName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: {
                        ...draft.location,
                        parishName: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Lugar
                <input
                  value={draft.location.placeLine}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: {
                        ...draft.location,
                        placeLine: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Título sección sede
                <input
                  value={draft.location.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: { ...draft.location, title: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Organización (footer)
                <input
                  value={draft.footer.org}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: { ...draft.footer, org: e.target.value },
                    })
                  }
                />
              </label>
            </div>
          </section>
        )}

        {section === "logo" && (
          <section className="admin-panel">
            <h2>Logo principal</h2>
            <p className="admin-panel__hint">
              Sube el PNG aquí en local: se guarda en{" "}
              <code>public/images/</code>. También puedes pegar esa ruta a mano.
            </p>
            <div className="admin-logo-preview">
              <img src={draft.logoUrl} alt="Vista previa del logo" />
            </div>
            <label className="file-field">
              Subir logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={onMainLogoChange}
              />
            </label>
            <label>
              Ruta o URL del logo
              <input
                value={draft.logoUrl}
                onChange={(e) =>
                  setDraft({ ...draft, logoUrl: e.target.value })
                }
                placeholder="/images/logo-principal.png"
              />
            </label>
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  persist();
                  setLogoNotice("Ruta del logo guardada.");
                }}
              >
                Guardar logo
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setDraft({ ...draft, logoUrl: DEFAULT_CONTENT.logoUrl });
                  setLogoNotice("Se restauró el logo principal.");
                }}
              >
                Usar logo oficial
              </button>
            </div>

            <h3>Logo del footer</h3>
            <p className="admin-panel__hint">
              Es independiente del logo del hero. Por defecto se usa el de
              Pastoral Juvenil.
            </p>
            <div className="admin-logo-preview">
              <img src={draft.footer.logoUrl} alt="Vista previa del logo del footer" />
            </div>
            <label className="file-field">
              Subir logo del footer
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={onFooterLogoChange}
              />
            </label>
            <label>
              Ruta o URL del logo del footer
              <input
                value={draft.footer.logoUrl}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    footer: { ...draft.footer, logoUrl: e.target.value },
                  })
                }
                placeholder="/images/logo-pja.webp"
              />
            </label>
          </section>
        )}

        {section === "hero" && (
          <section className="admin-panel">
            <h2>Hero</h2>
            <label>
              Lema / slogan
              <input
                value={draft.hero.slogan}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, slogan: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Texto de apoyo
              <textarea
                rows={2}
                value={draft.hero.tagline}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, tagline: e.target.value },
                  })
                }
              />
            </label>
            <div className="admin-grid">
              <label>
                Texto del botón
                <input
                  value={draft.hero.ctaLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: { ...draft.hero, ctaLabel: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Enlace del botón
                <input
                  value={draft.hero.ctaHref}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: { ...draft.hero, ctaHref: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            <h3>Datos puntuales</h3>
            {draft.hero.highlights.map((item, index) => (
              <div className="admin-card" key={item.id}>
                <div className="admin-grid">
                  <label>
                    Etiqueta
                    <input
                      value={item.label}
                      onChange={(e) => {
                        const highlights = [...draft.hero.highlights];
                        highlights[index] = { ...item, label: e.target.value };
                        setDraft({
                          ...draft,
                          hero: { ...draft.hero, highlights },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Dato
                    <input
                      value={item.value}
                      onChange={(e) => {
                        const highlights = [...draft.hero.highlights];
                        highlights[index] = { ...item, value: e.target.value };
                        setDraft({
                          ...draft,
                          hero: { ...draft.hero, highlights },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Enlace
                    <input
                      value={item.href}
                      onChange={(e) => {
                        const highlights = [...draft.hero.highlights];
                        highlights[index] = { ...item, href: e.target.value };
                        setDraft({
                          ...draft,
                          hero: { ...draft.hero, highlights },
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>
        )}

        {section === "location" && (
          <section className="admin-panel">
            <h2>Sede</h2>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.location.eyebrow}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: { ...draft.location, eyebrow: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Título
                <input
                  value={draft.location.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: { ...draft.location, title: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={3}
                value={draft.location.lead}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    location: { ...draft.location, lead: e.target.value },
                  })
                }
              />
            </label>
            <div className="admin-grid">
              <label>
                Etiqueta parroquia
                <input
                  value={draft.location.parishLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: {
                        ...draft.location,
                        parishLabel: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Nombre parroquia
                <input
                  value={draft.location.parishName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: {
                        ...draft.location,
                        parishName: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Lugar
                <input
                  value={draft.location.placeLine}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      location: {
                        ...draft.location,
                        placeLine: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Nota
              <textarea
                rows={4}
                value={draft.location.note}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    location: { ...draft.location, note: e.target.value },
                  })
                }
              />
            </label>
            <h3>Datos rápidos</h3>
            {draft.location.facts.map((fact, index) => (
              <div className="admin-grid" key={fact.id}>
                <label>
                  Etiqueta
                  <input
                    value={fact.label}
                    onChange={(e) => {
                      const facts = [...draft.location.facts];
                      facts[index] = { ...fact, label: e.target.value };
                      setDraft({
                        ...draft,
                        location: { ...draft.location, facts },
                      });
                    }}
                  />
                </label>
                <label>
                  Valor
                  <input
                    value={fact.value}
                    onChange={(e) => {
                      const facts = [...draft.location.facts];
                      facts[index] = { ...fact, value: e.target.value };
                      setDraft({
                        ...draft,
                        location: { ...draft.location, facts },
                      });
                    }}
                  />
                </label>
              </div>
            ))}

            <h3>Mapa y cómo llegar</h3>
            <p className="admin-panel__hint">
              Con la dirección basta. Si pones coordenadas, los botones de Google
              Maps y Waze llevan al punto exacto.
            </p>
            <label>
              Dirección que se busca en el mapa
              <input
                value={draft.location.mapQuery}
                onChange={(e) => patchLocation({ mapQuery: e.target.value })}
                placeholder="Parroquia San Cristóbal, Jayaque, La Libertad"
              />
            </label>
            <div className="admin-grid">
              <label>
                Latitud (opcional)
                <input
                  value={draft.location.mapLat}
                  onChange={(e) => patchLocation({ mapLat: e.target.value })}
                  placeholder="13.6333"
                />
              </label>
              <label>
                Longitud (opcional)
                <input
                  value={draft.location.mapLng}
                  onChange={(e) => patchLocation({ mapLng: e.target.value })}
                  placeholder="-89.4333"
                />
              </label>
            </div>
            <div className="admin-grid">
              <label>
                Texto para abrir el mapa
                <input
                  value={draft.location.mapLabel}
                  onChange={(e) => patchLocation({ mapLabel: e.target.value })}
                />
              </label>
              <label>
                Botón Google Maps
                <input
                  value={draft.location.directionsLabel}
                  onChange={(e) =>
                    patchLocation({ directionsLabel: e.target.value })
                  }
                />
              </label>
              <label>
                Botón Waze
                <input
                  value={draft.location.wazeLabel}
                  onChange={(e) => patchLocation({ wazeLabel: e.target.value })}
                />
              </label>
            </div>
            <label>
              Nota bajo el mapa
              <input
                value={draft.location.mapNote}
                onChange={(e) => patchLocation({ mapNote: e.target.value })}
              />
            </label>
          </section>
        )}

        {section === "meaning" && (
          <section className="admin-panel">
            <h2>Significado del logo</h2>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.meaning.eyebrow}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      meaning: { ...draft.meaning, eyebrow: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Título
                <input
                  value={draft.meaning.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      meaning: { ...draft.meaning, title: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.meaning.lead}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    meaning: { ...draft.meaning, lead: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Cita bajo el logo
              <input
                value={draft.meaning.quote}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    meaning: { ...draft.meaning, quote: e.target.value },
                  })
                }
              />
            </label>
            <h3>Elementos</h3>
            {draft.meaning.elements.map((item, index) => (
              <div className="admin-card" key={item.id}>
                <div className="admin-grid">
                  <label>
                    Título
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const elements = [...draft.meaning.elements];
                        elements[index] = { ...item, title: e.target.value };
                        setDraft({
                          ...draft,
                          meaning: { ...draft.meaning, elements },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Resumen
                    <input
                      value={item.summary}
                      onChange={(e) => {
                        const elements = [...draft.meaning.elements];
                        elements[index] = { ...item, summary: e.target.value };
                        setDraft({
                          ...draft,
                          meaning: { ...draft.meaning, elements },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Color de acento
                    <select
                      value={item.accent}
                      onChange={(e) => {
                        const elements = [...draft.meaning.elements];
                        elements[index] = {
                          ...item,
                          accent: e.target.value as AccentTone,
                        };
                        setDraft({
                          ...draft,
                          meaning: { ...draft.meaning, elements },
                        });
                      }}
                    >
                      {ACCENTS.map((accent) => (
                        <option key={accent} value={accent}>
                          {accent}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Texto
                  <textarea
                    rows={3}
                    value={item.body}
                    onChange={(e) => {
                      const elements = [...draft.meaning.elements];
                      elements[index] = { ...item, body: e.target.value };
                      setDraft({
                        ...draft,
                        meaning: { ...draft.meaning, elements },
                      });
                    }}
                  />
                </label>
              </div>
            ))}
          </section>
        )}

        {section === "event" && (
          <section className="admin-panel">
            <h2>Información del evento</h2>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.event.eyebrow}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      event: { ...draft.event, eyebrow: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Título
                <input
                  value={draft.event.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      event: { ...draft.event, title: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.event.lead}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    event: { ...draft.event, lead: e.target.value },
                  })
                }
              />
            </label>
            {draft.event.items.map((item, index) => (
              <div className="admin-card" key={item.id}>
                <div className="admin-grid">
                  <label>
                    Etiqueta
                    <input
                      value={item.label}
                      onChange={(e) => {
                        const items = [...draft.event.items];
                        items[index] = { ...item, label: e.target.value };
                        setDraft({
                          ...draft,
                          event: { ...draft.event, items },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Título
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const items = [...draft.event.items];
                        items[index] = { ...item, title: e.target.value };
                        setDraft({
                          ...draft,
                          event: { ...draft.event, items },
                        });
                      }}
                    />
                  </label>
                </div>
                <label>
                  Texto
                  <textarea
                    rows={3}
                    value={item.text}
                    onChange={(e) => {
                      const items = [...draft.event.items];
                      items[index] = { ...item, text: e.target.value };
                      setDraft({
                        ...draft,
                        event: { ...draft.event, items },
                      });
                    }}
                  />
                </label>
              </div>
            ))}
          </section>
        )}

        {section === "schedule" && (
          <section className="admin-panel">
            <h2>Fechas y agenda</h2>
            <p className="admin-panel__hint">
              La cuenta regresiva aparece en la landing solo cuando hay fecha de
              inicio. La agenda se muestra cuando agregas al menos un día. Las
              horas se entienden en hora de El Salvador.
            </p>
            <div className="admin-grid">
              <label>
                Inicio del encuentro
                <input
                  type="datetime-local"
                  value={draft.schedule.startDate}
                  onChange={(e) => patchSchedule({ startDate: e.target.value })}
                />
              </label>
              <label>
                Fin del encuentro
                <input
                  type="datetime-local"
                  value={draft.schedule.endDate}
                  onChange={(e) => patchSchedule({ endDate: e.target.value })}
                />
              </label>
              <label>
                Texto mientras no hay fecha
                <input
                  value={draft.schedule.dateLabel}
                  onChange={(e) => patchSchedule({ dateLabel: e.target.value })}
                />
              </label>
            </div>

            <h3>Cuenta regresiva</h3>
            <div className="admin-grid">
              <label>
                Etiqueta
                <input
                  value={draft.schedule.countdownEyebrow}
                  onChange={(e) =>
                    patchSchedule({ countdownEyebrow: e.target.value })
                  }
                />
              </label>
              <label>
                Palabra antes de los números
                <input
                  value={draft.schedule.countdownTitle}
                  onChange={(e) =>
                    patchSchedule({ countdownTitle: e.target.value })
                  }
                />
              </label>
              <label>
                Mensaje durante el evento
                <input
                  value={draft.schedule.countdownLiveText}
                  onChange={(e) =>
                    patchSchedule({ countdownLiveText: e.target.value })
                  }
                />
              </label>
              <label>
                Mensaje después del evento
                <input
                  value={draft.schedule.countdownDoneText}
                  onChange={(e) =>
                    patchSchedule({ countdownDoneText: e.target.value })
                  }
                />
              </label>
            </div>

            <h3>Textos de la sección</h3>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.schedule.eyebrow}
                  onChange={(e) => patchSchedule({ eyebrow: e.target.value })}
                />
              </label>
              <label>
                Título
                <input
                  value={draft.schedule.title}
                  onChange={(e) => patchSchedule({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.schedule.lead}
                onChange={(e) => patchSchedule({ lead: e.target.value })}
              />
            </label>

            <h3>Programa</h3>
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  patchSchedule({
                    days: [
                      ...draft.schedule.days,
                      {
                        id: createId("dia"),
                        label: `Día ${draft.schedule.days.length + 1}`,
                        date: "",
                        items: [],
                      },
                    ],
                  })
                }
              >
                Agregar día
              </button>
            </div>
            {draft.schedule.days.length === 0 ? (
              <p className="admin-empty">
                Sin días agregados la sección de agenda no se muestra en la
                landing.
              </p>
            ) : (
              draft.schedule.days.map((day, dayIndex) => (
                <div className="admin-card" key={day.id}>
                  <div className="admin-grid">
                    <label>
                      Nombre del día
                      <input
                        value={day.label}
                        onChange={(e) =>
                          patchDay(dayIndex, { label: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fecha visible
                      <input
                        value={day.date}
                        onChange={(e) =>
                          patchDay(dayIndex, { date: e.target.value })
                        }
                        placeholder="Sábado 15 de agosto"
                      />
                    </label>
                  </div>

                  {day.items.map((item, itemIndex) => (
                    <div className="admin-grid" key={item.id}>
                      <label>
                        Hora
                        <input
                          value={item.time}
                          onChange={(e) => {
                            const items = [...day.items];
                            items[itemIndex] = { ...item, time: e.target.value };
                            patchDay(dayIndex, { items });
                          }}
                          placeholder="08:00"
                        />
                      </label>
                      <label>
                        Actividad
                        <input
                          value={item.title}
                          onChange={(e) => {
                            const items = [...day.items];
                            items[itemIndex] = { ...item, title: e.target.value };
                            patchDay(dayIndex, { items });
                          }}
                        />
                      </label>
                      <label>
                        Detalle
                        <input
                          value={item.text}
                          onChange={(e) => {
                            const items = [...day.items];
                            items[itemIndex] = { ...item, text: e.target.value };
                            patchDay(dayIndex, { items });
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() =>
                          patchDay(dayIndex, {
                            items: day.items.filter(
                              (entry) => entry.id !== item.id,
                            ),
                          })
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  ))}

                  <div className="admin-inline-actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        patchDay(dayIndex, {
                          items: [
                            ...day.items,
                            {
                              id: createId("hora"),
                              time: "",
                              title: "Nueva actividad",
                              text: "",
                            },
                          ],
                        })
                      }
                    >
                      Agregar actividad
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        patchSchedule({
                          days: draft.schedule.days.filter(
                            (entry) => entry.id !== day.id,
                          ),
                        })
                      }
                    >
                      Quitar día
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {section === "registration" && (
          <section className="admin-panel">
            <h2>Inscripción</h2>
            <p className="admin-panel__hint">
              Mientras no haya enlace, la sección muestra el estado y los pasos de
              preparación. Puedes usar un formulario de Google como enlace.
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.registration.eyebrow}
                  onChange={(e) => patchRegistration({ eyebrow: e.target.value })}
                />
              </label>
              <label>
                Título
                <input
                  value={draft.registration.title}
                  onChange={(e) => patchRegistration({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.registration.lead}
                onChange={(e) => patchRegistration({ lead: e.target.value })}
              />
            </label>
            <div className="admin-grid">
              <label>
                Estado
                <select
                  value={draft.registration.status}
                  onChange={(e) =>
                    patchRegistration({
                      status: e.target.value as RegistrationStatus,
                    })
                  }
                >
                  {(
                    Object.keys(REGISTRATION_STATUS_LABELS) as RegistrationStatus[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {REGISTRATION_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Texto del estado
                <input
                  value={draft.registration.statusLabel}
                  onChange={(e) =>
                    patchRegistration({ statusLabel: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="admin-grid">
              <label>
                Botón principal
                <input
                  value={draft.registration.ctaLabel}
                  onChange={(e) => patchRegistration({ ctaLabel: e.target.value })}
                  placeholder="Inscribirme"
                />
              </label>
              <label>
                Enlace del formulario
                <input
                  value={draft.registration.ctaHref}
                  onChange={(e) => patchRegistration({ ctaHref: e.target.value })}
                  placeholder="https://forms.gle/…"
                />
              </label>
              <label>
                Botón secundario
                <input
                  value={draft.registration.secondaryLabel}
                  onChange={(e) =>
                    patchRegistration({ secondaryLabel: e.target.value })
                  }
                  placeholder="Ver catequesis"
                />
              </label>
              <label>
                Enlace secundario
                <input
                  value={draft.registration.secondaryHref}
                  onChange={(e) =>
                    patchRegistration({ secondaryHref: e.target.value })
                  }
                  placeholder="/catequesis"
                />
              </label>
            </div>
            <label>
              Nota
              <textarea
                rows={2}
                value={draft.registration.note}
                onChange={(e) => patchRegistration({ note: e.target.value })}
              />
            </label>

            <h3>Pasos</h3>
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  patchRegistration({
                    steps: [
                      ...draft.registration.steps,
                      { id: createId("paso"), title: "Nuevo paso", text: "" },
                    ],
                  })
                }
              >
                Agregar paso
              </button>
            </div>
            {draft.registration.steps.map((step, index) => (
              <div className="admin-card" key={step.id}>
                <label>
                  Título
                  <input
                    value={step.title}
                    onChange={(e) => {
                      const steps = [...draft.registration.steps];
                      steps[index] = { ...step, title: e.target.value };
                      patchRegistration({ steps });
                    }}
                  />
                </label>
                <label>
                  Texto
                  <textarea
                    rows={2}
                    value={step.text}
                    onChange={(e) => {
                      const steps = [...draft.registration.steps];
                      steps[index] = { ...step, text: e.target.value };
                      patchRegistration({ steps });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() =>
                    patchRegistration({
                      steps: draft.registration.steps.filter(
                        (entry) => entry.id !== step.id,
                      ),
                    })
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
          </section>
        )}

        {section === "catechesis" && (
          <section className="admin-panel">
            <h2>Catequesis / documentos</h2>
            <p className="admin-panel__hint">
              En Examinar se ven todos los archivos de tu computadora. El que
              elijas, aunque esté en Descargas u otra carpeta, se copia a{" "}
              <code>public/docs</code> y queda en la página de Catequesis.
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.catechesis.eyebrow}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      catechesis: {
                        ...draft.catechesis,
                        eyebrow: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Título
                <input
                  value={draft.catechesis.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      catechesis: {
                        ...draft.catechesis,
                        title: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.catechesis.lead}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    catechesis: { ...draft.catechesis, lead: e.target.value },
                  })
                }
              />
            </label>
            <div className="admin-grid">
              <label>
                Título vacío
                <input
                  value={draft.catechesis.emptyTitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      catechesis: {
                        ...draft.catechesis,
                        emptyTitle: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Texto vacío
                <input
                  value={draft.catechesis.emptyText}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      catechesis: {
                        ...draft.catechesis,
                        emptyText: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
            <label className={`file-field${uploading ? " is-busy" : ""}`}>
              {uploading ? "Copiando a public/docs…" : "Elegir documentos (cualquier carpeta)"}
              <input
                type="file"
                multiple
                disabled={uploading}
                onChange={onCatechesisUpload}
              />
            </label>
            {projectDocs.length > 0 ? (
              <div className="admin-project-files">
                <p className="admin-panel__hint">
                  Archivos ya guardados en <code>public/docs</code>:
                </p>
                <ul>
                  {projectDocs.map((file) => {
                    const inUse = draft.catechesis.docs.some(
                      (doc) => doc.href === file.url || doc.fileName === file.name,
                    );
                    return (
                      <li key={file.url}>
                        <a href={file.url} target="_blank" rel="noreferrer">
                          {file.name}
                        </a>
                        {inUse ? (
                          <span>En catequesis</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => {
                              setDraft({
                                ...draft,
                                catechesis: {
                                  ...draft.catechesis,
                                  docs: [
                                    ...draft.catechesis.docs,
                                    {
                                      id: createId("doc"),
                                      title: file.name.replace(/\.[^.]+$/, ""),
                                      description: "",
                                      fileName: file.name,
                                      href: file.url,
                                      coverUrl: file.url.toLowerCase().endsWith(".pdf")
                                        ? `/docs/covers/${file.name.replace(/\.pdf$/i, "")}.webp`
                                        : undefined,
                                    },
                                  ],
                                },
                              });
                            }}
                          >
                            Usar
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  setDraft({
                    ...draft,
                    catechesis: {
                      ...draft.catechesis,
                      docs: [
                        ...draft.catechesis.docs,
                        {
                          id: createId("doc"),
                          title: "Nueva catequesis",
                          description: "",
                          fileName: "",
                          href: "/docs/",
                        },
                      ],
                    },
                  })
                }
              >
                Agregar documento
              </button>
            </div>
            {draft.catechesis.docs.length === 0 ? (
              <p className="admin-empty">
                Aún no hay documentos. Súbelos en local o pega una ruta de{" "}
                <code>public/docs</code>.
              </p>
            ) : (
              draft.catechesis.docs.map((doc, index) => (
                <div className="admin-card" key={doc.id}>
                  <div className="admin-grid">
                    <label>
                      Título
                      <input
                        value={doc.title}
                        onChange={(e) => {
                          const docs = [...draft.catechesis.docs];
                          docs[index] = { ...doc, title: e.target.value };
                          setDraft({
                            ...draft,
                            catechesis: { ...draft.catechesis, docs },
                          });
                        }}
                      />
                    </label>
                    <label>
                      Nombre de archivo
                      <input
                        value={doc.fileName}
                        onChange={(e) => {
                          const docs = [...draft.catechesis.docs];
                          docs[index] = { ...doc, fileName: e.target.value };
                          setDraft({
                            ...draft,
                            catechesis: { ...draft.catechesis, docs },
                          });
                        }}
                      />
                    </label>
                  </div>
                  <label>
                    Descripción
                    <textarea
                      rows={2}
                      value={doc.description}
                      onChange={(e) => {
                        const docs = [...draft.catechesis.docs];
                        docs[index] = { ...doc, description: e.target.value };
                        setDraft({
                          ...draft,
                          catechesis: { ...draft.catechesis, docs },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Enlace o archivo
                    <input
                      value={doc.href}
                      onChange={(e) => {
                        const docs = [...draft.catechesis.docs];
                        docs[index] = { ...doc, href: e.target.value };
                        setDraft({
                          ...draft,
                          catechesis: { ...draft.catechesis, docs },
                        });
                      }}
                      placeholder="/docs/catequesis-1.pdf"
                    />
                  </label>
                  {doc.href && doc.href !== "/docs/" ? (
                    <>
                      <a
                        className="btn btn--ghost"
                        href={doc.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver archivo
                      </a>
                      {/\.pdf($|\?)/i.test(`${doc.href} ${doc.fileName}`) ? (
                        <iframe
                          className="admin-doc-preview"
                          title={doc.title}
                          src={doc.href}
                        />
                      ) : null}
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        catechesis: {
                          ...draft.catechesis,
                          docs: draft.catechesis.docs.filter(
                            (item) => item.id !== doc.id,
                          ),
                        },
                      })
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {section === "faq" && (
          <section className="admin-panel">
            <h2>Preguntas frecuentes</h2>
            <p className="admin-panel__hint">
              Estas preguntas también se envían a Google como datos
              estructurados, así que conviene que las respuestas sean claras y
              cortas.
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.faq.eyebrow}
                  onChange={(e) => patchFaq({ eyebrow: e.target.value })}
                />
              </label>
              <label>
                Título
                <input
                  value={draft.faq.title}
                  onChange={(e) => patchFaq({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.faq.lead}
                onChange={(e) => patchFaq({ lead: e.target.value })}
              />
            </label>

            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  patchFaq({
                    items: [
                      ...draft.faq.items,
                      {
                        id: createId("faq"),
                        question: "Nueva pregunta",
                        answer: "",
                      },
                    ],
                  })
                }
              >
                Agregar pregunta
              </button>
            </div>
            {draft.faq.items.length === 0 ? (
              <p className="admin-empty">
                Sin preguntas la sección no se muestra en la landing.
              </p>
            ) : (
              draft.faq.items.map((item, index) => (
                <div className="admin-card" key={item.id}>
                  <label>
                    Pregunta
                    <input
                      value={item.question}
                      onChange={(e) => {
                        const items = [...draft.faq.items];
                        items[index] = { ...item, question: e.target.value };
                        patchFaq({ items });
                      }}
                    />
                  </label>
                  <label>
                    Respuesta
                    <textarea
                      rows={3}
                      value={item.answer}
                      onChange={(e) => {
                        const items = [...draft.faq.items];
                        items[index] = { ...item, answer: e.target.value };
                        patchFaq({ items });
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() =>
                      patchFaq({
                        items: draft.faq.items.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      })
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {section === "vicariates" && (
          <section className="admin-panel">
            <h2>Vicarías</h2>
            <p className="admin-panel__hint">
              Agrega las 17 vicarías de la Arquidiócesis. La sección aparece en
              la landing cuando hay al menos una.
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.vicariates.eyebrow}
                  onChange={(e) => patchVicariates({ eyebrow: e.target.value })}
                />
              </label>
              <label>
                Título
                <input
                  value={draft.vicariates.title}
                  onChange={(e) => patchVicariates({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.vicariates.lead}
                onChange={(e) => patchVicariates({ lead: e.target.value })}
              />
            </label>

            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  patchVicariates({
                    items: [
                      ...draft.vicariates.items,
                      { id: createId("vicaria"), name: "", note: "" },
                    ],
                  })
                }
              >
                Agregar vicaría
              </button>
            </div>
            {draft.vicariates.items.length === 0 ? (
              <p className="admin-empty">
                Sin vicarías la sección no se muestra en la landing.
              </p>
            ) : (
              draft.vicariates.items.map((item, index) => (
                <div className="admin-grid" key={item.id}>
                  <label>
                    Nombre
                    <input
                      value={item.name}
                      onChange={(e) => {
                        const items = [...draft.vicariates.items];
                        items[index] = { ...item, name: e.target.value };
                        patchVicariates({ items });
                      }}
                    />
                  </label>
                  <label>
                    Detalle
                    <input
                      value={item.note}
                      onChange={(e) => {
                        const items = [...draft.vicariates.items];
                        items[index] = { ...item, note: e.target.value };
                        patchVicariates({ items });
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() =>
                      patchVicariates({
                        items: draft.vicariates.items.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      })
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {section === "partners" && (
          <section className="admin-panel">
            <h2>Logos institucionales</h2>
            <div className="admin-grid">
              <label>
                Etiqueta superior
                <input
                  value={draft.partners.eyebrow}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      partners: { ...draft.partners, eyebrow: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Título
                <input
                  value={draft.partners.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      partners: { ...draft.partners, title: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.partners.lead}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    partners: { ...draft.partners, lead: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Crédito
              <input
                value={draft.partners.credit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    partners: { ...draft.partners, credit: e.target.value },
                  })
                }
              />
            </label>
            <p className="admin-panel__hint">
              En local sube los logos aquí: se guardan en{" "}
              <code>public/images/</code>. También puedes pegar esa ruta.
            </p>
            <label className="file-field">
              Subir logos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPartnerUpload}
              />
            </label>
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  setDraft({
                    ...draft,
                    partners: {
                      ...draft.partners,
                      logos: [
                        ...draft.partners.logos,
                        {
                          id: createId("logo"),
                          name: "Logo institucional",
                          src: "/images/",
                        },
                      ],
                    },
                  })
                }
              >
                Agregar logo
              </button>
            </div>
            <div className="admin-logos">
              {draft.partners.logos.length === 0 ? (
                <p className="admin-empty">
                  Aún no hay logos. Súbelos en local o pega una ruta de{" "}
                  <code>public/images</code>.
                </p>
              ) : (
                draft.partners.logos.map((logo, index) => (
                  <div className="admin-logo-item" key={logo.id}>
                    <img src={logo.src} alt={logo.name} />
                    <label>
                      Nombre
                      <input
                        value={logo.name}
                        onChange={(e) => {
                          const logos = [...draft.partners.logos];
                          logos[index] = { ...logo, name: e.target.value };
                          setDraft({
                            ...draft,
                            partners: { ...draft.partners, logos },
                          });
                        }}
                      />
                    </label>
                    <label>
                      Ruta o URL
                      <input
                        value={logo.src}
                        onChange={(e) => {
                          const logos = [...draft.partners.logos];
                          logos[index] = { ...logo, src: e.target.value };
                          setDraft({
                            ...draft,
                            partners: { ...draft.partners, logos },
                          });
                        }}
                        placeholder="/images/logo.png"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          partners: {
                            ...draft.partners,
                            logos: draft.partners.logos.filter(
                              (l) => l.id !== logo.id,
                            ),
                          },
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {section === "footer" && (
          <section className="admin-panel">
            <h2>Footer y redes</h2>
            <label>
              Organización
              <input
                value={draft.footer.org}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    footer: { ...draft.footer, org: e.target.value },
                  })
                }
              />
            </label>
            <div className="admin-grid">
              <label>
                Título menú
                <input
                  value={draft.footer.exploreLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        exploreLabel: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Título redes
                <input
                  value={draft.footer.socialLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        socialLabel: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Pie izquierdo
                <input
                  value={draft.footer.bottomLeft}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        bottomLeft: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Pie derecho
                <input
                  value={draft.footer.bottomRight}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        bottomRight: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>

            <h3>Menú del navbar</h3>
            <div className="admin-grid">
              <label>
                Botón del navbar
                <input
                  value={draft.header.ctaLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      header: { ...draft.header, ctaLabel: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                Enlace del botón
                <input
                  value={draft.header.ctaHref}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      header: { ...draft.header, ctaHref: e.target.value },
                    })
                  }
                />
              </label>
            </div>
            {draft.header.nav.map((item, index) => (
              <div className="admin-card" key={item.id}>
                <div className="admin-grid">
                  <label>
                    Etiqueta
                    <input
                      value={item.label}
                      onChange={(e) => {
                        const nav = [...draft.header.nav];
                        nav[index] = { ...item, label: e.target.value };
                        setDraft({
                          ...draft,
                          header: { ...draft.header, nav },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Enlace
                    <input
                      value={item.href}
                      onChange={(e) => {
                        const nav = [...draft.header.nav];
                        nav[index] = { ...item, href: e.target.value };
                        setDraft({
                          ...draft,
                          header: { ...draft.header, nav },
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}

            <h3>Menú del footer</h3>
            {draft.footer.nav.map((item, index) => (
              <div className="admin-card" key={item.id}>
                <div className="admin-grid">
                  <label>
                    Etiqueta
                    <input
                      value={item.label}
                      onChange={(e) => {
                        const nav = [...draft.footer.nav];
                        nav[index] = { ...item, label: e.target.value };
                        setDraft({
                          ...draft,
                          footer: { ...draft.footer, nav },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Enlace
                    <input
                      value={item.href}
                      onChange={(e) => {
                        const nav = [...draft.footer.nav];
                        nav[index] = { ...item, href: e.target.value };
                        setDraft({
                          ...draft,
                          footer: { ...draft.footer, nav },
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}

            <h3>Redes sociales</h3>
            {draft.footer.social.map((item, index) => (
              <div className="admin-card" key={item.id}>
                <div className="admin-grid">
                  <label>
                    Nombre
                    <input
                      value={item.name}
                      onChange={(e) => {
                        const social = [...draft.footer.social];
                        social[index] = { ...item, name: e.target.value };
                        setDraft({
                          ...draft,
                          footer: { ...draft.footer, social },
                        });
                      }}
                    />
                  </label>
                  <label>
                    Handle
                    <input
                      value={item.handle}
                      onChange={(e) => {
                        const social = [...draft.footer.social];
                        social[index] = { ...item, handle: e.target.value };
                        setDraft({
                          ...draft,
                          footer: { ...draft.footer, social },
                        });
                      }}
                    />
                  </label>
                  <label>
                    URL
                    <input
                      value={item.href}
                      onChange={(e) => {
                        const social = [...draft.footer.social];
                        social[index] = { ...item, href: e.target.value };
                        setDraft({
                          ...draft,
                          footer: { ...draft.footer, social },
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
