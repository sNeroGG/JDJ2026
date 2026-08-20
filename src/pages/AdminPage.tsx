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
  type InstagramPostItem,
  type PartnerLogo,
  type RegistrationStatus,
  type SiteContent,
  type StoreOrder,
  type StoreOrderStatus,
  type StoreProduct,
} from "../data/defaultContent";
import { createId, downloadJson } from "../utils/files";
import { instagramPermalink, normalizeInstagramPosts } from "../utils/instagram";
import { uploadMedia } from "../utils/media";
import { formatOrderDate, formatUsd } from "../utils/store";
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
    updateContent,
    saveContent,
    resetContent,
    isAuthenticated,
    canPublish,
    login,
    logout,
  } = useContent();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [section, setSection] = useState("site");
  const [logoNotice, setLogoNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [projectDocs, setProjectDocs] = useState<{ name: string; url: string }[]>(
    [],
  );
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [ordersNotice, setOrdersNotice] = useState("");
  const [ordersPersist, setOrdersPersist] = useState("");

  useEffect(() => {
    setDraft(content);
  }, [content]);

  useEffect(() => {
    if (!isAuthenticated || section !== "catechesis" || !import.meta.env.DEV) {
      return;
    }
    const secret = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
    void fetch("/__admin/files", {
      headers: { Authorization: `Bearer ${secret}` },
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

  useEffect(() => {
    if (!isAuthenticated || section !== "orders") return;
    const secret = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
    void fetch("/api/orders", {
      headers: { Authorization: `Bearer ${secret}` },
    })
      .then(async (remote) => {
        const payload = (await remote.json().catch(() => null)) as {
          orders?: StoreOrder[];
          persist?: string;
          error?: string;
        } | null;
        if (!remote.ok) {
          setOrdersNotice(payload?.error || "No se pudieron cargar los pedidos.");
          return;
        }
        setOrders(payload?.orders ?? []);
        setOrdersPersist(payload?.persist || "");
        setOrdersNotice("");
      })
      .catch(() => {
        setOrdersNotice("No se pudieron cargar los pedidos.");
      });
  }, [isAuthenticated, section]);

  const partnerCount = draft.partners.logos.length;
  const docCount = draft.catechesis.docs.length;
  const itemCount = draft.schedule.items.length;
  const faqCount = draft.faq.items.length;
  const productCount = draft.store.products.length;
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(content),
    [draft, content],
  );

  const navItems = useMemo(
    () => [
      { id: "site", label: "Portada", full: "Logos y portada" },
      {
        id: "event",
        label: `Encuentro${itemCount ? ` (${itemCount})` : ""}`,
        full: "Fecha, agenda y evento",
      },
      { id: "location", label: "Sede", full: "Sede y mapa" },
      {
        id: "catechesis",
        label: `Catequesis${docCount ? ` (${docCount})` : ""}`,
        full: "Documentos de catequesis",
      },
      {
        id: "store",
        label: `Tienda${productCount ? ` (${productCount})` : ""}`,
        full: "Logo, productos y WhatsApp",
      },
      {
        id: "orders",
        label: `Pedidos${orders.length ? ` (${orders.length})` : ""}`,
        full: "Pedidos de la tienda",
      },
      {
        id: "page",
        label: "Página",
        full: "Textos, logos y pie",
      },
    ],
    [itemCount, docCount, productCount, orders.length],
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
  function patchHero(patch: Partial<SiteContent["hero"]>) {
    setDraft({ ...draft, hero: { ...draft.hero, ...patch } });
  }
  function patchLocation(patch: Partial<SiteContent["location"]>) {
    setDraft({ ...draft, location: { ...draft.location, ...patch } });
  }
  function patchInstagram(patch: Partial<SiteContent["instagram"]>) {
    setDraft({ ...draft, instagram: { ...draft.instagram, ...patch } });
  }
  function patchInstagramPost(index: number, patch: Partial<InstagramPostItem>) {
    const posts = [...draft.instagram.posts];
    posts[index] = { ...posts[index], ...patch };
    patchInstagram({ posts });
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
  function patchMeaning(patch: Partial<SiteContent["meaning"]>) {
    setDraft({ ...draft, meaning: { ...draft.meaning, ...patch } });
  }
  function patchEvent(patch: Partial<SiteContent["event"]>) {
    setDraft({ ...draft, event: { ...draft.event, ...patch } });
  }
  function patchCatechesis(patch: Partial<SiteContent["catechesis"]>) {
    setDraft({ ...draft, catechesis: { ...draft.catechesis, ...patch } });
  }
  function patchFooter(patch: Partial<SiteContent["footer"]>) {
    setDraft({ ...draft, footer: { ...draft.footer, ...patch } });
  }
  function patchPartners(patch: Partial<SiteContent["partners"]>) {
    setDraft({ ...draft, partners: { ...draft.partners, ...patch } });
  }
  function patchStore(patch: Partial<SiteContent["store"]>) {
    setDraft({ ...draft, store: { ...draft.store, ...patch } });
  }
  function patchProduct(index: number, patch: Partial<StoreProduct>) {
    const products = [...draft.store.products];
    products[index] = { ...products[index], ...patch };
    patchStore({ products });
  }

  function patchHighlight(
    index: number,
    patch: Partial<SiteContent["hero"]["highlights"][number]>,
  ) {
    const highlights = [...draft.hero.highlights];
    highlights[index] = { ...highlights[index], ...patch };
    patchHero({ highlights });
  }

  function patchScheduleItem(
    index: number,
    patch: Partial<SiteContent["schedule"]["items"][number]>,
  ) {
    const items = [...draft.schedule.items];
    items[index] = { ...items[index], ...patch };
    patchSchedule({ items });
  }

  async function persist(next: SiteContent = draft) {
    const value: SiteContent = {
      ...next,
      instagram: {
        ...next.instagram,
        posts: normalizeInstagramPosts(next.instagram.posts),
      },
    };
    setDraft(value);
    setContent(value);
    try {
      const mode = await saveContent(value);
      setSavedAt(new Date().toLocaleTimeString("es-SV"));
      setLogoNotice(
        mode === "github"
          ? "Publicado. Vercel está reconstruyendo el sitio: el cambio se ve en vivo en un par de minutos."
          : "Cambios guardados en el proyecto.",
      );
    } catch (error) {
      setLogoNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el contenido.",
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
    } finally {
      setUploading(false);
    }
  }

  async function onStoreLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOrWarn(file, "images");
      if (!uploaded) return;
      const next = {
        ...draft,
        store: { ...draft.store, logoUrl: uploaded.url },
      };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  async function onProductImageChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOrWarn(file, "images");
      if (!uploaded) return;
      const products = [...draft.store.products];
      products[index] = { ...products[index], imageUrl: uploaded.url };
      const next = { ...draft, store: { ...draft.store, products } };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  async function onInstagramImageChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOrWarn(file, "images");
      if (!uploaded) return;
      const posts = [...draft.instagram.posts];
      posts[index] = { ...posts[index], imageUrl: uploaded.url };
      const next = {
        ...draft,
        instagram: { ...draft.instagram, posts },
      };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  function applyProductStock(productId: string, delta: number) {
    const apply = (products: StoreProduct[]) =>
      products.map((item) =>
        item.id === productId
          ? { ...item, stock: Math.max(0, item.stock + delta) }
          : item,
      );
    setDraft((prev) => ({
      ...prev,
      store: { ...prev.store, products: apply(prev.store.products) },
    }));
    updateContent((prev) => ({
      ...prev,
      store: { ...prev.store, products: apply(prev.store.products) },
    }));
  }

  async function patchOrderStatus(id: string, status: StoreOrderStatus) {
    const current = orders.find((item) => item.id === id);
    if (!current || current.status === status) return;
    const secret = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
    setOrdersNotice("Actualizando pedido…");
    try {
      const remote = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await remote.json().catch(() => null)) as {
        error?: string;
        order?: StoreOrder;
      } | null;
      if (!remote.ok || !payload?.order) {
        setOrdersNotice(payload?.error || "No se pudo actualizar el pedido.");
        return;
      }
      setOrders((prev) =>
        prev.map((item) => (item.id === id ? payload.order! : item)),
      );
      if (status === "cancelado" && current.status !== "cancelado") {
        applyProductStock(current.productId, current.quantity);
      }
      if (current.status === "cancelado" && status !== "cancelado") {
        applyProductStock(current.productId, -current.quantity);
      }
      setOrdersNotice("Pedido actualizado.");
    } catch {
      setOrdersNotice("No se pudo actualizar el pedido.");
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
      await persist(next);
      setLogoNotice(
        `${uploads.length} documento(s) copiados a public/docs y listos en Catequesis.`,
      );
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
          <p>Guarda en local y luego sube el commit a GitHub para publicarlo.</p>
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

  const sedeHighlight = draft.hero.highlights.find((item) => item.id === "sede");
  const parishHighlight = draft.hero.highlights.find(
    (item) => item.id === "parroquia",
  );

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          <strong>JDJ Admin</strong>
          <span>Lo esencial del sitio</span>
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
          <Link to="/tienda">Ver tienda</Link>
          <button
            type="button"
            onClick={() => downloadJson("jdj2026-content.json", draft)}
          >
            Exportar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("¿Restablecer todo al contenido original?")) return;
              setDraft(DEFAULT_CONTENT);
              void resetContent()
                .then(() => {
                  setSavedAt(new Date().toLocaleTimeString("es-SV"));
                  setLogoNotice("Contenido restablecido.");
                })
                .catch((error: unknown) => {
                  setLogoNotice(
                    error instanceof Error
                      ? error.message
                      : "No se pudo restablecer el contenido.",
                  );
                });
            }}
          >
            Restablecer
          </button>
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
          </div>
          <div className="admin__actions">
            {isDirty ? <span className="admin__dirty">Sin guardar</span> : null}
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
              className="btn btn--primary"
              disabled={uploading}
              onClick={() => void persist().catch(() => undefined)}
            >
              {import.meta.env.DEV ? "Guardar" : "Publicar"}
            </button>
          </div>
        </header>

        {canPublish ? null : (
          <p className="admin-notice is-warning" role="status">
            Falta configurar GITHUB_TOKEN en Vercel: los cambios no se podrán
            publicar desde aquí.
          </p>
        )}

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

        {section === "site" && (
          <div className="admin-stack">
            <section className="admin-panel">
              <h2>Logos</h2>
              <div className="admin-logo-pair">
                <div>
                  <p className="admin-panel__kicker">Portada</p>
                  <div className="admin-logo-preview">
                    <img src={draft.logoUrl} alt="Logo de la portada" />
                  </div>
                  <label className="file-field">
                    Subir logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                      onChange={onMainLogoChange}
                    />
                  </label>
                </div>
                <div>
                  <p className="admin-panel__kicker">Footer / pestaña</p>
                  <div className="admin-logo-preview">
                    <img
                      src={draft.footer.logoUrl}
                      alt="Logo del footer"
                    />
                  </div>
                  <label className="file-field">
                    Subir emblema
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                      onChange={onFooterLogoChange}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <h2>Textos de portada</h2>
              <div className="admin-grid">
                <label>
                  Nombre
                  <input
                    value={draft.site.name}
                    onChange={(e) => patchSite({ name: e.target.value })}
                  />
                </label>
                <label>
                  Año
                  <input
                    value={draft.site.year}
                    onChange={(e) => patchSite({ year: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Lema
                <input
                  value={draft.hero.slogan}
                  onChange={(e) => patchHero({ slogan: e.target.value })}
                />
              </label>
              <label>
                Texto debajo del lema
                <textarea
                  rows={2}
                  value={draft.hero.tagline}
                  onChange={(e) => patchHero({ tagline: e.target.value })}
                />
              </label>
              <div className="admin-grid">
                <label>
                  Sede (tarjeta)
                  <input
                    value={sedeHighlight?.value ?? ""}
                    onChange={(e) => {
                      const index = draft.hero.highlights.findIndex(
                        (item) => item.id === "sede",
                      );
                      if (index >= 0) patchHighlight(index, { value: e.target.value });
                    }}
                  />
                </label>
                <label>
                  Parroquia (tarjeta)
                  <input
                    value={parishHighlight?.value ?? ""}
                    onChange={(e) => {
                      const index = draft.hero.highlights.findIndex(
                        (item) => item.id === "parroquia",
                      );
                      if (index >= 0) {
                        patchHighlight(index, { value: e.target.value });
                      }
                    }}
                  />
                </label>
              </div>
              <p className="admin-panel__hint">
                La tarjeta de fecha se toma sola del 14 de noviembre de 2026.
              </p>
            </section>

            <details className="admin-details">
              <summary>SEO y compartir enlace</summary>
              <div className="admin-panel">
                <label>
                  Título de la pestaña
                  <input
                    value={draft.site.pageTitle}
                    onChange={(e) => patchSite({ pageTitle: e.target.value })}
                  />
                </label>
                <label>
                  Descripción
                  <textarea
                    rows={2}
                    value={draft.site.metaDescription}
                    onChange={(e) =>
                      patchSite({ metaDescription: e.target.value })
                    }
                  />
                </label>
                <div className="admin-grid">
                  <label>
                    Dominio
                    <input
                      value={draft.site.url}
                      onChange={(e) => patchSite({ url: e.target.value })}
                      placeholder="https://jdj2026.org"
                    />
                  </label>
                  <label>
                    Imagen OG
                    <input
                      value={draft.site.ogImage}
                      onChange={(e) => patchSite({ ogImage: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            </details>
          </div>
        )}

        {section === "event" && (
          <div className="admin-stack">
            <section className="admin-panel">
              <h2>Fecha</h2>
              <p className="admin-panel__hint">
                Activa la cuenta regresiva. Hora de El Salvador.
              </p>
              <label>
                Inicio del encuentro
                <input
                  type="datetime-local"
                  value={draft.schedule.startDate}
                  onChange={(e) => patchSchedule({ startDate: e.target.value })}
                />
              </label>
            </section>

            <section className="admin-panel">
              <h2>Agenda del día</h2>
              <div className="admin-inline-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    patchSchedule({
                      items: [
                        ...draft.schedule.items,
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
              </div>
              {draft.schedule.items.length === 0 ? (
                <p className="admin-empty">
                  Sin actividades, la agenda no se muestra.
                </p>
              ) : (
                draft.schedule.items.map((item, index) => (
                  <div className="admin-grid" key={item.id}>
                    <label>
                      Hora
                      <input
                        value={item.time}
                        onChange={(e) =>
                          patchScheduleItem(index, { time: e.target.value })
                        }
                        placeholder="08:00"
                      />
                    </label>
                    <label>
                      Actividad
                      <input
                        value={item.title}
                        onChange={(e) =>
                          patchScheduleItem(index, { title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Detalle
                      <input
                        value={item.text}
                        onChange={(e) =>
                          patchScheduleItem(index, { text: e.target.value })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        patchSchedule({
                          items: draft.schedule.items.filter(
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

            <section className="admin-panel">
              <h2>Tarjetas del evento</h2>
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
                          patchEvent({ items });
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
                          patchEvent({ items });
                        }}
                      />
                    </label>
                  </div>
                  <label>
                    Texto
                    <textarea
                      rows={2}
                      value={item.text}
                      onChange={(e) => {
                        const items = [...draft.event.items];
                        items[index] = { ...item, text: e.target.value };
                        patchEvent({ items });
                      }}
                    />
                  </label>
                </div>
              ))}
            </section>

            <details className="admin-details">
              <summary>
                Inscripción{" "}
                {draft.registration.enabled ? "(visible)" : "(oculta)"}
              </summary>
              <div className="admin-panel">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={draft.registration.enabled}
                    onChange={(e) =>
                      patchRegistration({ enabled: e.target.checked })
                    }
                  />
                  Mostrar en la landing
                </label>
                {draft.registration.enabled ? (
                  <>
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
                            Object.keys(
                              REGISTRATION_STATUS_LABELS,
                            ) as RegistrationStatus[]
                          ).map((status) => (
                            <option key={status} value={status}>
                              {REGISTRATION_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Enlace del formulario
                        <input
                          value={draft.registration.ctaHref}
                          onChange={(e) =>
                            patchRegistration({ ctaHref: e.target.value })
                          }
                          placeholder="https://forms.gle/…"
                        />
                      </label>
                    </div>
                    <label>
                      Texto del botón
                      <input
                        value={draft.registration.ctaLabel}
                        onChange={(e) =>
                          patchRegistration({ ctaLabel: e.target.value })
                        }
                      />
                    </label>
                  </>
                ) : (
                  <p className="admin-panel__hint">
                    Cuando haya formulario, actívala y pega el enlace.
                  </p>
                )}
              </div>
            </details>
          </div>
        )}

        {section === "location" && (
          <section className="admin-panel">
            <h2>Sede</h2>
            <div className="admin-grid">
              <label>
                Parroquia
                <input
                  value={draft.location.parishName}
                  onChange={(e) =>
                    patchLocation({ parishName: e.target.value })
                  }
                />
              </label>
              <label>
                Lugar
                <input
                  value={draft.location.placeLine}
                  onChange={(e) =>
                    patchLocation({ placeLine: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Título
              <input
                value={draft.location.title}
                onChange={(e) => patchLocation({ title: e.target.value })}
              />
            </label>
            <label>
              Texto
              <textarea
                rows={3}
                value={draft.location.lead}
                onChange={(e) => patchLocation({ lead: e.target.value })}
              />
            </label>
            <h2>Instagram</h2>
            <p className="admin-panel__hint">
              Empieza con 1 publicación y puedes agregar hasta 3. Instagram no
              deja mostrar la foto sin su texto: sube aquí la imagen (captura o
              descarga) y pega el enlace. En la landing se ve tu imagen; el clic
              abre Instagram.
            </p>
            <div className="admin-grid">
              <label>
                Usuario
                <input
                  value={draft.instagram.handle}
                  onChange={(e) =>
                    patchInstagram({ handle: e.target.value.replace(/^@/, "") })
                  }
                  placeholder="pjarqui_ss"
                />
              </label>
              <label>
                Título del apartado
                <input
                  value={draft.instagram.title}
                  onChange={(e) => patchInstagram({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto
              <input
                value={draft.instagram.lead}
                onChange={(e) => patchInstagram({ lead: e.target.value })}
              />
            </label>
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={draft.instagram.posts.length >= 3}
                onClick={() =>
                  patchInstagram({
                    posts: [
                      ...draft.instagram.posts,
                      { url: "", imageUrl: "" },
                    ],
                  })
                }
              >
                Agregar publicación
              </button>
            </div>
            {draft.instagram.posts.length === 0 ? (
              <p className="admin-empty">
                Aún no hay publicaciones. Agrega 1 para mostrarla en Sede.
              </p>
            ) : (
              draft.instagram.posts.map((post, index) => (
                <div className="admin-card" key={`ig-${index}`}>
                  <p className="admin-panel__kicker">
                    Publicación {index + 1} de {draft.instagram.posts.length}
                  </p>
                  {post.imageUrl ? (
                    <div className="admin-product-preview">
                      <img src={post.imageUrl} alt="" />
                    </div>
                  ) : null}
                  <label className={`file-field${uploading ? " is-busy" : ""}`}>
                    {uploading ? "Copiando…" : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                      disabled={uploading}
                      onChange={(e) => void onInstagramImageChange(index, e)}
                    />
                  </label>
                  <label>
                    Enlace de Instagram
                    <input
                      value={post.url}
                      onChange={(e) =>
                        patchInstagramPost(index, { url: e.target.value })
                      }
                      onBlur={() => {
                        const permalink = instagramPermalink(post.url);
                        if (permalink && permalink !== post.url) {
                          patchInstagramPost(index, { url: permalink });
                        }
                      }}
                      placeholder="https://www.instagram.com/p/…"
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() =>
                      patchInstagram({
                        posts: draft.instagram.posts.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
            <label>
              Dirección para el mapa
              <input
                value={draft.location.mapQuery}
                onChange={(e) => patchLocation({ mapQuery: e.target.value })}
              />
            </label>
            <div className="admin-grid">
              <label>
                Latitud
                <input
                  value={draft.location.mapLat}
                  onChange={(e) => patchLocation({ mapLat: e.target.value })}
                  placeholder="13.6333"
                />
              </label>
              <label>
                Longitud
                <input
                  value={draft.location.mapLng}
                  onChange={(e) => patchLocation({ mapLng: e.target.value })}
                  placeholder="-89.4333"
                />
              </label>
            </div>
          </section>
        )}

        {section === "catechesis" && (
          <section className="admin-panel">
            <h2>Documentos</h2>
            <p className="admin-panel__hint">
              Se copian a <code>public/docs</code> y se ven en /catequesis.
            </p>
            <label>
              Título de la página
              <input
                value={draft.catechesis.title}
                onChange={(e) => patchCatechesis({ title: e.target.value })}
              />
            </label>
            <label>
              Texto introductorio
              <textarea
                rows={2}
                value={draft.catechesis.lead}
                onChange={(e) => patchCatechesis({ lead: e.target.value })}
              />
            </label>
            <label className={`file-field${uploading ? " is-busy" : ""}`}>
              {uploading ? "Copiando…" : "Subir documentos"}
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
                  En <code>public/docs</code>:
                </p>
                <ul>
                  {projectDocs.map((file) => {
                    const inUse = draft.catechesis.docs.some(
                      (doc) =>
                        doc.href === file.url || doc.fileName === file.name,
                    );
                    return (
                      <li key={file.url}>
                        <a href={file.url} target="_blank" rel="noreferrer">
                          {file.name}
                        </a>
                        {inUse ? (
                          <span>En uso</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() =>
                              patchCatechesis({
                                docs: [
                                  ...draft.catechesis.docs,
                                  {
                                    id: createId("doc"),
                                    title: file.name.replace(/\.[^.]+$/, ""),
                                    description: "",
                                    fileName: file.name,
                                    href: file.url,
                                    coverUrl: file.url
                                      .toLowerCase()
                                      .endsWith(".pdf")
                                      ? `/docs/covers/${file.name.replace(/\.pdf$/i, "")}.webp`
                                      : undefined,
                                  },
                                ],
                              })
                            }
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
            {draft.catechesis.docs.length === 0 ? (
              <p className="admin-empty">Aún no hay documentos.</p>
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
                          patchCatechesis({ docs });
                        }}
                      />
                    </label>
                    <label>
                      Archivo
                      <input
                        value={doc.href}
                        onChange={(e) => {
                          const docs = [...draft.catechesis.docs];
                          docs[index] = { ...doc, href: e.target.value };
                          patchCatechesis({ docs });
                        }}
                      />
                    </label>
                  </div>
                  {doc.href && doc.href !== "/docs/" ? (
                    <a
                      className="btn btn--ghost"
                      href={doc.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver archivo
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() =>
                      patchCatechesis({
                        docs: draft.catechesis.docs.filter(
                          (item) => item.id !== doc.id,
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

        {section === "store" && (
          <div className="admin-stack">
            <section className="admin-panel">
              <h2>Logo de la tienda</h2>
              <p className="admin-panel__hint">
                Es un logo aparte de la portada y del footer. Se ve en /tienda.
                Súbelo en local con <code>npm run dev</code>.
              </p>
              {draft.store.logoUrl ? (
                <div className="admin-logo-preview">
                  <img src={draft.store.logoUrl} alt="Logo de la tienda" />
                </div>
              ) : (
                <p className="admin-empty">Aún no hay logo de tienda.</p>
              )}
              <label className={`file-field${uploading ? " is-busy" : ""}`}>
                {uploading ? "Copiando…" : "Subir logo de tienda"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  disabled={uploading}
                  onChange={onStoreLogoChange}
                />
              </label>
            </section>

            <section className="admin-panel">
              <h2>Textos y compra</h2>
              <div className="admin-grid">
                <label>
                  Etiqueta
                  <input
                    value={draft.store.eyebrow}
                    onChange={(e) => patchStore({ eyebrow: e.target.value })}
                  />
                </label>
                <label>
                  Título
                  <input
                    value={draft.store.title}
                    onChange={(e) => patchStore({ title: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Texto introductorio
                <textarea
                  rows={2}
                  value={draft.store.lead}
                  onChange={(e) => patchStore({ lead: e.target.value })}
                />
              </label>
              <div className="admin-grid">
                <label>
                  WhatsApp (con código de país)
                  <input
                    value={draft.store.whatsapp}
                    onChange={(e) => patchStore({ whatsapp: e.target.value })}
                    placeholder="50370123456"
                  />
                </label>
                <label>
                  Texto del botón
                  <input
                    value={draft.store.ctaLabel}
                    onChange={(e) => patchStore({ ctaLabel: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Nota de pago (transferencia)
                <textarea
                  rows={3}
                  value={draft.store.paymentNote}
                  onChange={(e) => patchStore({ paymentNote: e.target.value })}
                />
              </label>
            </section>

            <section className="admin-panel">
              <h2>Productos{productCount ? ` (${productCount})` : ""}</h2>
              <p className="admin-panel__hint">
                Stock 0 se muestra como AGOTADO. Las tallas van separadas por
                coma, por ejemplo S, M, L, XL.
              </p>
              <div className="admin-inline-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    patchStore({
                      products: [
                        ...draft.store.products,
                        {
                          id: createId("prod"),
                          title: "Camisa JDJ 2026",
                          description: "",
                          price: 10,
                          imageUrl: "",
                          stock: 0,
                          sizes: ["S", "M", "L", "XL"],
                        },
                      ],
                    })
                  }
                >
                  Agregar producto
                </button>
              </div>
              {draft.store.products.length === 0 ? (
                <p className="admin-empty">Aún no hay productos.</p>
              ) : (
                draft.store.products.map((product, index) => (
                  <div className="admin-card" key={product.id}>
                    {product.imageUrl ? (
                      <div className="admin-product-preview">
                        <img src={product.imageUrl} alt={product.title} />
                      </div>
                    ) : null}
                    <label className={`file-field${uploading ? " is-busy" : ""}`}>
                      {uploading ? "Copiando…" : "Imagen del producto"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        disabled={uploading}
                        onChange={(e) => void onProductImageChange(index, e)}
                      />
                    </label>
                    <label>
                      Título
                      <input
                        value={product.title}
                        onChange={(e) =>
                          patchProduct(index, { title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        rows={2}
                        value={product.description}
                        onChange={(e) =>
                          patchProduct(index, { description: e.target.value })
                        }
                      />
                    </label>
                    <div className="admin-grid">
                      <label>
                        Precio (USD)
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={product.price}
                          onChange={(e) =>
                            patchProduct(index, {
                              price: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label>
                        Stock (0 = agotado)
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={product.stock}
                          onChange={(e) =>
                            patchProduct(index, {
                              stock: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Tallas
                      <input
                        value={product.sizes.join(", ")}
                        onChange={(e) =>
                          patchProduct(index, {
                            sizes: e.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="S, M, L, XL"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        patchStore({
                          products: draft.store.products.filter(
                            (item) => item.id !== product.id,
                          ),
                        })
                      }
                    >
                      Quitar producto
                    </button>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {section === "orders" && (
          <section className="admin-panel">
            <h2>Pedidos{orders.length ? ` (${orders.length})` : ""}</h2>
            <p className="admin-panel__hint">
              Cada compra llega aquí y se abre WhatsApp con el pedido. El pago
              es por transferencia.
              {ordersPersist === "memory"
                ? " En producción, configura GITHUB_TOKEN si quieres conservarlos entre deploys."
                : ordersPersist === "file"
                  ? " En local se guardan en src/data/savedOrders.ts."
                  : ""}
            </p>
            <div className="admin-inline-actions">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={!orders.length}
                onClick={() => downloadJson("jdj2026-pedidos.json", orders)}
              >
                Exportar JSON
              </button>
            </div>
            {ordersNotice ? (
              <p className="admin-panel__hint">{ordersNotice}</p>
            ) : null}
            {orders.length === 0 ? (
              <p className="admin-empty">Aún no hay pedidos.</p>
            ) : (
              orders.map((order) => (
                <article className="admin-order" key={order.id}>
                  <div className="admin-order__top">
                    <strong>{order.id}</strong>
                    <span className={`admin-order__status is-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <p>
                    {order.name} · {order.email} · {order.phone}
                  </p>
                  <p>
                    {order.productTitle}
                    {order.size ? ` · Talla ${order.size}` : ""} ·{" "}
                    {order.quantity} {order.quantity === 1 ? "unidad" : "unidades"}{" "}
                    · {formatUsd(order.total)} · {order.payment}
                  </p>
                  {order.note ? <p>Nota: {order.note}</p> : null}
                  <p className="admin-order__date">
                    {formatOrderDate(order.createdAt)}
                  </p>
                  <div className="admin-inline-actions">
                    {order.status !== "atendido" ? (
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => void patchOrderStatus(order.id, "atendido")}
                      >
                        Marcar atendido
                      </button>
                    ) : null}
                    {order.status !== "nuevo" ? (
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => void patchOrderStatus(order.id, "nuevo")}
                      >
                        Marcar nuevo
                      </button>
                    ) : null}
                    {order.status !== "cancelado" ? (
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() =>
                          void patchOrderStatus(order.id, "cancelado")
                        }
                      >
                        Cancelar y devolver stock
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {section === "page" && (
          <div className="admin-stack">
            <section className="admin-panel">
              <h2>Preguntas frecuentes{faqCount ? ` (${faqCount})` : ""}</h2>
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
              {draft.faq.items.map((item, index) => (
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
                      rows={2}
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
              ))}
            </section>

            <section className="admin-panel">
              <h2>Significado del logo</h2>
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
                          patchMeaning({ elements });
                        }}
                      />
                    </label>
                    <label>
                      Color
                      <select
                        value={item.accent}
                        onChange={(e) => {
                          const elements = [...draft.meaning.elements];
                          elements[index] = {
                            ...item,
                            accent: e.target.value as AccentTone,
                          };
                          patchMeaning({ elements });
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
                      rows={2}
                      value={item.body}
                      onChange={(e) => {
                        const elements = [...draft.meaning.elements];
                        elements[index] = { ...item, body: e.target.value };
                        patchMeaning({ elements });
                      }}
                    />
                  </label>
                </div>
              ))}
            </section>

            <section className="admin-panel">
              <h2>Logos institucionales{partnerCount ? ` (${partnerCount})` : ""}</h2>
              <label className="file-field">
                Subir logos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPartnerUpload}
                />
              </label>
              <div className="admin-logos">
                {draft.partners.logos.map((logo, index) => (
                  <div className="admin-logo-item" key={logo.id}>
                    <img src={logo.src} alt={logo.name} />
                    <label>
                      Nombre
                      <input
                        value={logo.name}
                        onChange={(e) => {
                          const logos = [...draft.partners.logos];
                          logos[index] = { ...logo, name: e.target.value };
                          patchPartners({ logos });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        patchPartners({
                          logos: draft.partners.logos.filter(
                            (entry) => entry.id !== logo.id,
                          ),
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <details className="admin-details">
              <summary>Pie, redes y vicarías</summary>
              <div className="admin-panel">
                <label>
                  Organización
                  <input
                    value={draft.footer.org}
                    onChange={(e) => patchFooter({ org: e.target.value })}
                  />
                </label>
                {draft.footer.social.map((item, index) => (
                  <div className="admin-grid" key={item.id}>
                    <label>
                      Red
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const social = [...draft.footer.social];
                          social[index] = { ...item, name: e.target.value };
                          patchFooter({ social });
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
                          patchFooter({ social });
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
                          patchFooter({ social });
                        }}
                      />
                    </label>
                  </div>
                ))}
                <h3>Vicarías</h3>
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
                {draft.vicariates.items.map((item, index) => (
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
                ))}
              </div>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}
