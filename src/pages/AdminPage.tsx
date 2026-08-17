import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import {
  DEFAULT_CONTENT,
  type AccentTone,
  type SiteContent,
} from "../data/defaultContent";
import { createId, downloadJson, readFileAsDataUrl } from "../utils/files";
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
  const [section, setSection] = useState("hero");

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const partnerCount = draft.partners.logos.length;

  const navItems = useMemo(
    () => [
      { id: "hero", label: "Hero" },
      { id: "logo", label: "Logo principal" },
      { id: "location", label: "Sede" },
      { id: "meaning", label: "Significado" },
      { id: "event", label: "Evento" },
      { id: "partners", label: `Logos (${partnerCount})` },
      { id: "footer", label: "Footer / Redes" },
    ],
    [partnerCount],
  );

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    const ok = login(password);
    setError(ok ? "" : "Contraseña incorrecta");
    if (ok) setPassword("");
  }

  function persist(next: SiteContent = draft) {
    setContent(next);
    saveContent(next);
    setSavedAt(new Date().toLocaleTimeString("es-SV"));
  }

  async function onMainLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = await readFileAsDataUrl(file);
    setDraft((prev) => ({ ...prev, logoUrl: src }));
  }

  async function onPartnerUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("logo"),
        name: file.name.replace(/\.[^.]+$/, ""),
        src: await readFileAsDataUrl(file),
      })),
    );
    setDraft((prev) => ({
      ...prev,
      partners: {
        ...prev.partners,
        logos: [...prev.partners.logos, ...uploads],
      },
    }));
    event.target.value = "";
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <form className="admin-login__card" onSubmit={handleLogin}>
          <p className="admin-login__eyebrow">JDJ 2026</p>
          <h1>Panel de administración</h1>
          <p>Edita textos, logo y logos institucionales de la landing.</p>
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
          <span>Edición rápida</span>
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
              Los cambios se guardan en este navegador. Exporta JSON si quieres
              respaldarlos.
            </p>
          </div>
          <div className="admin__actions">
            {savedAt ? <span>Guardado {savedAt}</span> : null}
            <button type="button" className="btn btn--ghost" onClick={() => setDraft(content)}>
              Descartar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (confirm("¿Restablecer todo al contenido original?")) {
                  resetContent();
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
            <button type="button" className="btn btn--primary" onClick={() => persist()}>
              Guardar cambios
            </button>
          </div>
        </header>

        {section === "hero" && (
          <section className="admin-panel">
            <h2>Hero</h2>
            <label>
              Lema / slogan
              <input
                value={draft.hero.slogan}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, slogan: e.target.value } })
                }
              />
            </label>
            <label>
              Texto de apoyo
              <textarea
                rows={2}
                value={draft.hero.tagline}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, tagline: e.target.value } })
                }
              />
            </label>
            <label>
              Texto del botón
              <input
                value={draft.hero.ctaLabel}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, ctaLabel: e.target.value } })
                }
              />
            </label>
          </section>
        )}

        {section === "logo" && (
          <section className="admin-panel">
            <h2>Logo principal</h2>
            <div className="admin-logo-preview">
              <img src={draft.logoUrl} alt="Vista previa del logo" />
            </div>
            <label className="file-field">
              Subir nuevo logo (PNG/JPG/WebP)
              <input type="file" accept="image/*" onChange={onMainLogoChange} />
            </label>
            <label>
              URL del logo
              <input
                value={draft.logoUrl.startsWith("data:") ? "(imagen cargada en el navegador)" : draft.logoUrl}
                onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                disabled={draft.logoUrl.startsWith("data:")}
              />
            </label>
            {draft.logoUrl.startsWith("data:") ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  setDraft({ ...draft, logoUrl: DEFAULT_CONTENT.logoUrl })
                }
              >
                Usar logo oficial del sitio
              </button>
            ) : null}
          </section>
        )}

        {section === "location" && (
          <section className="admin-panel">
            <h2>Sede</h2>
            <div className="admin-grid">
              <label>
                Eyebrow
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
              Lead
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
                      location: { ...draft.location, parishLabel: e.target.value },
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
                      location: { ...draft.location, parishName: e.target.value },
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
                      location: { ...draft.location, placeLine: e.target.value },
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
                Eyebrow
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
              Lead
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
                    Acento
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
                Eyebrow
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
              Lead
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
                        setDraft({ ...draft, event: { ...draft.event, items } });
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
                        setDraft({ ...draft, event: { ...draft.event, items } });
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
                      setDraft({ ...draft, event: { ...draft.event, items } });
                    }}
                  />
                </label>
              </div>
            ))}
          </section>
        )}

        {section === "partners" && (
          <section className="admin-panel">
            <h2>Logos institucionales</h2>
            <div className="admin-grid">
              <label>
                Eyebrow
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
              Lead
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

            <label className="file-field">
              Agregar logos (puedes seleccionar varios)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPartnerUpload}
              />
            </label>

            <div className="admin-logos">
              {draft.partners.logos.length === 0 ? (
                <p className="admin-empty">Aún no hay logos. Sube los de la Arquidiócesis aquí.</p>
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
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          partners: {
                            ...draft.partners,
                            logos: draft.partners.logos.filter((l) => l.id !== logo.id),
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
                Pie izquierdo
                <input
                  value={draft.footer.bottomLeft}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: { ...draft.footer, bottomLeft: e.target.value },
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
                      footer: { ...draft.footer, bottomRight: e.target.value },
                    })
                  }
                />
              </label>
            </div>

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
