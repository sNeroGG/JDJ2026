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
  DEFAULT_CONTENT,
  type AccentTone,
  type SiteContent,
} from "../data/defaultContent";
import { createId, downloadJson } from "../utils/files";
import { uploadMedia } from "../utils/media";
import "./AdminPage.css";

const ACCENTS: AccentTone[] = ["orange", "sky", "teal", "green", "navy"];

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

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const partnerCount = draft.partners.logos.length;
  const docCount = draft.catechesis.docs.length;
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(content),
    [draft, content],
  );

  const navItems = useMemo(
    () => [
      { id: "variables", label: "Variables rápidas" },
      { id: "logo", label: "Logo PNG" },
      { id: "hero", label: "Hero" },
      { id: "location", label: "Sede" },
      { id: "meaning", label: "Significado" },
      { id: "event", label: "Evento" },
      { id: "catechesis", label: `Catequesis (${docCount})` },
      { id: "partners", label: `Logos (${partnerCount})` },
      { id: "footer", label: "Menú / Footer" },
    ],
    [partnerCount, docCount],
  );

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    const ok = await login(password);
    setError(ok ? "" : "Contraseña incorrecta");
    if (ok) setPassword("");
  }

  async function persist(next: SiteContent = draft) {
    setContent(next);
    try {
      await saveContent(next);
      setSavedAt(new Date().toLocaleTimeString("es-SV"));
    } catch (error) {
      setLogoNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar en Vercel.",
      );
    }
  }

  async function uploadOrWarn(file: File) {
    try {
      setLogoNotice(`Subiendo ${file.name}…`);
      const url = await uploadMedia(file);
      setLogoNotice(`${file.name} se subió. Guarda los cambios.`);
      return url;
    } catch {
      setLogoNotice(
        "No se pudo subir. En Vercel conecta un Blob Store. En local usa una ruta de public/.",
      );
      return null;
    }
  }

  async function onMainLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const url = await uploadOrWarn(file);
    if (!url) return;
    setDraft((prev) => ({ ...prev, logoUrl: url }));
  }

  async function onCatechesisUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    const uploads = [];
    for (const file of Array.from(files)) {
      const href = await uploadOrWarn(file);
      if (!href) continue;
      uploads.push({
        id: createId("doc"),
        title: file.name.replace(/\.[^.]+$/, ""),
        description: "",
        fileName: file.name,
        href,
      });
    }
    if (!uploads.length) return;
    setDraft((prev) => ({
      ...prev,
      catechesis: {
        ...prev.catechesis,
        docs: [...prev.catechesis.docs, ...uploads],
      },
    }));
  }

  async function onPartnerUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    const uploads = [];
    for (const file of Array.from(files)) {
      const src = await uploadOrWarn(file);
      if (!src) continue;
      uploads.push({
        id: createId("logo"),
        name: file.name.replace(/\.[^.]+$/, ""),
        src,
      });
    }
    if (!uploads.length) return;
    setDraft((prev) => ({
      ...prev,
      partners: {
        ...prev.partners,
        logos: [...prev.partners.logos, ...uploads],
      },
    }));
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <form className="admin-login__card" onSubmit={handleLogin}>
          <p className="admin-login__eyebrow">JDJ 2026</p>
          <h1>Panel de administración</h1>
          <p>
            En Vercel puedes subir logos y documentos. Se guardan en Blob y se
            ven en el sitio.
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
          <span>Variables editables</span>
        </div>
        <nav>
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
            <h1>Contenido de la landing</h1>
            <p>
              Guarda para publicar en Vercel (Blob) y en este navegador.
            </p>
          </div>
          <div className="admin__actions">
            {isDirty ? (
              <span className="admin__dirty">Cambios sin guardar</span>
            ) : null}
            {savedAt ? <span>Guardado {savedAt}</span> : null}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setDraft(content);
                setLogoNotice("");
              }}
            >
              Descartar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
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
              className="btn btn--ghost"
              onClick={() => downloadJson("jdj2026-content.json", draft)}
            >
              Exportar JSON
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => persist()}
            >
              Guardar cambios
            </button>
          </div>
        </header>

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
              En Vercel puedes subir el PNG aquí. En local también puedes usar
              una ruta de <code>public/images/</code>.
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
            {logoNotice ? <p className="admin-notice">{logoNotice}</p> : null}
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
                  setLogoNotice("Se restauró /images/logo-principal.png");
                }}
              >
                Usar logo oficial
              </button>
            </div>
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

        {section === "catechesis" && (
          <section className="admin-panel">
            <h2>Catequesis / documentos</h2>
            <p className="admin-panel__hint">
              En Vercel sube el PDF aquí. También puedes pegar una ruta de{" "}
              <code>public/docs/</code> o un enlace de Drive.
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
            <label className="file-field">
              Subir documentos
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf"
                multiple
                onChange={onCatechesisUpload}
              />
            </label>
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
                Aún no hay documentos. Agrega una ruta de <code>public/docs</code>{" "}
                o un enlace.
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
              En Vercel sube los logos aquí. También puedes pegar una ruta de{" "}
              <code>public/images/</code>.
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
                  Aún no hay logos. Agrega rutas de <code>public/images</code>.
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
