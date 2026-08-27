import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { ADMIN_ROUTE } from "../utils/adminRoute";
import {
  AUTH_SECRET_KEY,
  DEFAULT_CONTENT,
  type AccentTone,
  type CatechesisDoc,
  type MemoryPhoto,
  type AlbumPhoto,
  type PartnerLogo,
  type RegistrationStatus,
  type SiteContent,
  type SocialLink,
  type StoreOrder,
  type StoreOrderStatus,
  type StoreProduct,
  type StoreVariant,
} from "../data/defaultContent";
import { createId, downloadJson } from "../utils/files";
import { thumbSrc } from "../utils/images";
import { uploadMedia } from "../utils/media";
import {
  isAdminSection,
  searchAdminParts,
  type AdminPart,
  type AdminSection,
} from "../utils/adminPanel";
import {
  donationStatusLabel,
  type DonationRecord,
  type DonationStatus,
} from "../utils/donations";
import {
  instagramHandleOf,
  instagramProfileUrl,
  SOCIAL_NETWORKS,
  withSocialDefaults,
} from "../utils/social";
import {
  buildOrderReport,
  defaultProductVariants,
  findVariant,
  formatOrderDate,
  formatUsd,
  normalizeStoreProducts,
  productImages,
  productStock,
  variantLabel,
  withProductGallery,
} from "../utils/store";
import "./AdminPage.css";

const ACCENTS: AccentTone[] = ["orange", "sky", "teal", "green", "navy"];
const ALBUM_MAX = 200;
const IS_DEV = import.meta.env.DEV;

const TESTER_MODE_KEY = "jdj-admin-tester-mode";

function AdminModeSwitch({
  isDev,
  testerMode,
  onChange,
}: {
  isDev: boolean;
  testerMode: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="admin-mode" role="group" aria-label="Modo del panel">
      <button
        type="button"
        className={testerMode ? "is-active" : ""}
        disabled={!isDev}
        onClick={() => onChange(true)}
      >
        Modo tester
      </button>
      <button
        type="button"
        className={!testerMode ? "is-active" : ""}
        disabled={!isDev}
        onClick={() => onChange(false)}
      >
        Modo producción
      </button>
    </div>
  );
}

function AdminHeroImage({
  label,
  url,
  uploading,
  allowUploads,
  onPick,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  allowUploads: boolean;
  onPick: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="admin-panel__kicker">{label}</p>
      {url ? (
        <div className="admin-hero-preview">
          <img src={url} alt="" />
        </div>
      ) : (
        <p className="admin-empty">Aún no hay imagen hero.</p>
      )}
      {allowUploads ? (
        <div className="admin-inline-actions">
          <label className={`file-field${uploading ? " is-busy" : ""}`}>
            {uploading ? "Copiando…" : url ? "Cambiar imagen" : "Subir imagen"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              disabled={uploading}
              onChange={onPick}
            />
          </label>
          {url ? (
            <button type="button" className="btn btn--danger" onClick={onClear}>
              Quitar
            </button>
          ) : null}
        </div>
      ) : (
        <p className="admin-panel__hint">
          En producción no se suben fotos. Solo se edita texto.
        </p>
      )}
    </div>
  );
}

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

  useSeo({
    title: "Panel",
    description: "",
    path: ADMIN_ROUTE,
    siteUrl: content.site.url,
    image: content.site.ogImage,
    robots: "noindex, nofollow, noarchive",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const sectionParam = searchParams.get("seccion");
  const section: AdminSection = isAdminSection(sectionParam)
    ? sectionParam
    : "site";

  const openProductId = searchParams.get("producto");

  function setOpenProduct(id: string | null) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("seccion", "store");
        if (id) next.set("producto", id);
        else next.delete("producto");
        return next;
      },
      { replace: true },
    );
  }
  const [logoNotice, setLogoNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [projectDocs, setProjectDocs] = useState<{ name: string; url: string }[]>(
    [],
  );
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [ordersNotice, setOrdersNotice] = useState("");
  const [ordersPersist, setOrdersPersist] = useState("");
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donationsNotice, setDonationsNotice] = useState("");
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [donationFilter, setDonationFilter] = useState<"all" | DonationStatus>(
    "all",
  );
  const [query, setQuery] = useState("");
  const [testerMode, setTesterMode] = useState(() => {
    if (!IS_DEV) return false;
    try {
      return sessionStorage.getItem(TESTER_MODE_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const allowUploads = IS_DEV && testerMode;

  function setAdminMode(nextTester: boolean) {
    setTesterMode(nextTester);
    try {
      sessionStorage.setItem(TESTER_MODE_KEY, nextTester ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
  const parte = searchParams.get("parte");
  const queryMatches = useMemo(() => searchAdminParts(query), [query]);

  function setSection(id: AdminSection, nextParte?: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === "site") next.delete("seccion");
        else next.set("seccion", id);
        if (id !== "store") next.delete("producto");
        if (nextParte) next.set("parte", nextParte);
        else next.delete("parte");
        return next;
      },
      { replace: true },
    );
  }

  function goToPart(part: AdminPart) {
    setQuery("");
    setSection(part.section, part.id);
  }

  useEffect(() => {
    setDraft(content);
  }, [content]);

  useEffect(() => {
    if (!parte) return;
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(`parte-${parte}`);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [parte, section]);

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
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const secret = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
    void fetch("/api/donations", {
      headers: { Authorization: `Bearer ${secret}` },
    })
      .then(async (remote) => {
        const payload = (await remote.json().catch(() => null)) as {
          donations?: DonationRecord[];
          totalPaid?: number;
          error?: string;
        } | null;
        if (!remote.ok) {
          setDonationsNotice(
            payload?.error || "No se pudieron cargar las donaciones.",
          );
          return;
        }
        setDonations(payload?.donations ?? []);
        setDonationsTotal(payload?.totalPaid ?? 0);
        setDonationsNotice("");
      })
      .catch(() => {
        setDonationsNotice("No se pudieron cargar las donaciones.");
      });
  }, [isAuthenticated]);

  const partnerCount = draft.partners.logos.length;
  const docCount = draft.catechesis.docs.length;
  const albumCount = draft.album.images.length;
  const itemCount = draft.schedule.items.length;
  const faqCount = draft.faq.items.length;
  const productCount = draft.store.products.length;
  const orderReport = useMemo(
    () => buildOrderReport(orders, draft.store.products),
    [draft.store.products, orders],
  );

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(content),
    [draft, content],
  );

  const navItems = useMemo(
    (): { id: AdminSection; label: string; full: string }[] => [
      { id: "site", label: "Portada", full: "Logos y portada" },
      {
        id: "event",
        label: `Encuentro${itemCount ? ` (${itemCount})` : ""}`,
        full: "Fecha, agenda y evento",
      },
      { id: "location", label: "Sede", full: "Sede y mapa" },
      {
        id: "album",
        label: `Recuerdos${albumCount ? ` (${albumCount})` : ""}`,
        full: "Álbum polaroid de Jayaque",
      },
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
        id: "donations",
        label: `Donaciones${donations.length ? ` (${donations.length})` : ""}`,
        full: "Donaciones por transferencia",
      },
      {
        id: "page",
        label: "Página",
        full: "Textos, logos y pie",
      },
    ],
    [itemCount, docCount, albumCount, productCount, orders.length, donations.length],
  );
  const currentSection =
    navItems.find((item) => item.id === section) ?? navItems[0];

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    const result = await login(password);
    setError(result.ok ? "" : result.error || "Contraseña incorrecta");
    if (result.ok) setPassword("");
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
  function patchAbout(patch: Partial<SiteContent["about"]>) {
    setDraft({ ...draft, about: { ...draft.about, ...patch } });
  }
  function patchMemories(patch: Partial<SiteContent["memories"]>) {
    setDraft({ ...draft, memories: { ...draft.memories, ...patch } });
  }
  function patchDestination(patch: Partial<SiteContent["destination"]>) {
    setDraft({ ...draft, destination: { ...draft.destination, ...patch } });
  }
  function patchAlbum(patch: Partial<SiteContent["album"]>) {
    setDraft({ ...draft, album: { ...draft.album, ...patch } });
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
  function patchSocial(id: string, patch: Partial<SocialLink>) {
    const social = withSocialDefaults(draft.footer.social).map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      if (id === "instagram" && patch.handle != null) {
        const handle = String(patch.handle).replace(/^@/, "").trim();
        next.handle = handle ? `@${handle}` : "";
        if (patch.href == null) next.href = instagramProfileUrl(handle);
      }
      return next;
    });
    setDraft({
      ...draft,
      footer: { ...draft.footer, social },
      instagram: {
        ...draft.instagram,
        handle: instagramHandleOf(social, draft.instagram.handle),
      },
    });
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
        handle: instagramHandleOf(next.footer.social, next.instagram.handle),
        posts: [],
      },
      footer: {
        ...next.footer,
        social: withSocialDefaults(next.footer.social),
      },
      store: {
        ...next.store,
        products: normalizeStoreProducts(next.store.products),
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

  async function uploadOrWarn(
    file: File,
    folder: "images" | "docs",
    options?: { sequential?: boolean },
  ) {
    if (!allowUploads) {
      setLogoNotice(
        "En producción solo se editan textos. Sube fotos y archivos en local con npm run dev.",
      );
      return null;
    }
    try {
      setLogoNotice(`Copiando ${file.name} a public/${folder}…`);
      const uploaded = await uploadMedia(file, folder, options);
      setLogoNotice(
        uploaded?.url
          ? `${file.name} quedó como ${uploaded.url.replace(/^\/images\//, "")}.`
          : `${file.name} quedó en public/${folder}.`,
      );
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

  async function onHeroImageChange(
    event: ChangeEvent<HTMLInputElement>,
    apply: (url: string, current: SiteContent) => SiteContent,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadOrWarn(file, "images");
      if (!uploaded) return;
      const next = apply(uploaded.url, draft);
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

  async function onProductImagesChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadOrWarn(file, "images");
        if (result) uploaded.push(result.url);
      }
      if (!uploaded.length) return;
      const products = [...draft.store.products];
      products[index] = withProductGallery(products[index], [
        ...productImages(products[index]),
        ...uploaded,
      ]);
      const next = { ...draft, store: { ...draft.store, products } };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  async function onMemoriesUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    const remaining = Math.max(0, 5 - draft.memories.images.length);
    if (!remaining) return;
    setUploading(true);
    const uploads: MemoryPhoto[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const uploaded = await uploadOrWarn(file, "images");
        if (!uploaded) continue;
        uploads.push({
          id: createId("memoria"),
          src: uploaded.url,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      if (!uploads.length) return;
      const next = {
        ...draft,
        memories: {
          ...draft.memories,
          images: [...draft.memories.images, ...uploads],
        },
      };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  async function onDestinationUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    const remaining = Math.max(0, 5 - draft.destination.images.length);
    if (!remaining) return;
    setUploading(true);
    const uploads: MemoryPhoto[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const uploaded = await uploadOrWarn(file, "images");
        if (!uploaded) continue;
        uploads.push({
          id: createId("jayaque"),
          src: uploaded.url,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      if (!uploads.length) return;
      const next = {
        ...draft,
        destination: {
          ...draft.destination,
          images: [...draft.destination.images, ...uploads],
        },
      };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  async function onAlbumUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    const remaining = Math.max(0, ALBUM_MAX - draft.album.images.length);
    if (!remaining) return;
    setUploading(true);
    const uploads: AlbumPhoto[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const uploaded = await uploadOrWarn(file, "images", { sequential: true });
        if (!uploaded) continue;
        const number = uploaded.url.match(/(\d{3})\.webp$/i)?.[1];
        uploads.push({
          id: createId("album"),
          src: uploaded.url,
          alt: number ? `Foto ${number}` : "Foto del álbum",
          caption: "",
        });
      }
      if (!uploads.length) return;
      const next = {
        ...draft,
        album: {
          ...draft.album,
          images: [...draft.album.images, ...uploads],
        },
      };
      setDraft(next);
      await persist(next);
    } finally {
      setUploading(false);
    }
  }

  function patchVariant(
    productIndex: number,
    variantIndex: number,
    patch: Partial<StoreVariant>,
  ) {
    const product = draft.store.products[productIndex];
    const variants = product.variants.map((item, index) =>
      index === variantIndex ? { ...item, ...patch } : item,
    );
    patchProduct(productIndex, { variants });
  }

  function applyVariantStock(productId: string, variantId: string, delta: number) {
    const apply = (products: StoreProduct[]) =>
      products.map((item) =>
        item.id === productId
          ? {
              ...item,
              variants: item.variants.map((variant) =>
                variant.id === variantId
                  ? { ...variant, stock: Math.max(0, variant.stock + delta) }
                  : variant,
              ),
            }
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
      const variantId =
        current.variantId ||
        findVariant(
          draft.store.products.find((item) => item.id === current.productId) || {
            variants: [],
          },
          current,
        )?.id;
      if (variantId) {
        if (status === "cancelado" && current.status !== "cancelado") {
          applyVariantStock(current.productId, variantId, current.quantity);
        }
        if (current.status === "cancelado" && status !== "cancelado") {
          applyVariantStock(current.productId, variantId, -current.quantity);
        }
      }
      setOrdersNotice("Pedido actualizado.");
    } catch {
      setOrdersNotice("No se pudo actualizar el pedido.");
    }
  }

  async function patchDonationStatus(id: string, status: DonationStatus) {
    const current = donations.find((item) => item.id === id);
    if (!current || current.status === status) return;
    const secret = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
    setDonationsNotice("Actualizando donación…");
    try {
      const remote = await fetch("/api/donations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await remote.json().catch(() => null)) as {
        error?: string;
        donation?: DonationRecord;
      } | null;
      if (!remote.ok || !payload?.donation) {
        setDonationsNotice(payload?.error || "No se pudo actualizar la donación.");
        return;
      }
      const next = donations.map((item) =>
        item.id === id ? payload.donation! : item,
      );
      setDonations(next);
      setDonationsTotal(
        next
          .filter((item) => item.status === "paid")
          .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      );
      setDonationsNotice("Donación actualizada.");
    } catch {
      setDonationsNotice("No se pudo actualizar la donación.");
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
          <h1>Acceso restringido</h1>
          <p>Solo el equipo de la Pastoral Juvenil puede entrar aquí.</p>
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
    <div className={`admin${allowUploads ? "" : " admin--text-only"}`}>
      <aside className="admin__side">
        <div className="admin__brand">
          <strong>JDJ Admin</strong>
          <span>
            {allowUploads
              ? "Modo tester"
              : IS_DEV
                ? "Modo producción (prueba)"
                : "Producción: solo texto"}
          </span>
        </div>
        <label className="admin-search">
          <span className="sr-only">Buscar qué editar</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar qué editar…"
          />
        </label>
        {query.trim() ? (
          <ul className="admin-search-results">
            {queryMatches.length ? (
              queryMatches.map((part) => (
                <li key={part.id}>
                  <button type="button" onClick={() => goToPart(part)}>
                    <strong>{part.label}</strong>
                    <small>
                      {navItems.find((item) => item.id === part.section)?.label}
                    </small>
                  </button>
                </li>
              ))
            ) : (
              <li className="admin-search-empty">No hay coincidencias.</li>
            )}
          </ul>
        ) : (
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
        )}
        <div className="admin__side-actions">
          <details className="admin-view-menu">
            <summary>Ver el sitio</summary>
            <Link to="/">Landing</Link>
            <Link to="/recuerdos">Recuerdos</Link>
            <Link to="/catequesis">Catequesis</Link>
            <Link to="/tienda">Tienda</Link>
            <Link to="/donar">Donar</Link>
          </details>
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
            <AdminModeSwitch
              isDev={IS_DEV}
              testerMode={allowUploads}
              onChange={setAdminMode}
            />
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

        {allowUploads ? null : (
          <p className="admin-notice is-warning" role="status">
            {IS_DEV
              ? "Modo producción: no se puede subir ningún archivo. Cambia a modo tester para fotos y PDFs."
              : "El sitio está en producción: no se puede subir ningún archivo. Solo se edita texto. Las fotos se agregan en local con npm run dev."}
          </p>
        )}

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
            <details className="admin-details" id="parte-fotos" open>
              <summary>Modo del panel</summary>
              <div className="admin-panel">
                <AdminModeSwitch
                  isDev={IS_DEV}
                  testerMode={allowUploads}
                  onChange={setAdminMode}
                />
                <p className="admin-panel__hint">
                  {IS_DEV
                    ? "Modo tester sube fotos y PDFs al proyecto. Modo producción simula Vercel: solo texto, sin archivos."
                    : "En el sitio publicado este interruptor queda en modo producción. Sube archivos en local y luego publica."}
                </p>
              </div>
            </details>

            <section className="admin-panel" id="parte-logos">
              <h2>Logos</h2>
              <div className="admin-logo-pair">
                <div>
                  <p className="admin-panel__kicker">Portada</p>
                  <div className="admin-logo-preview">
                    <img src={draft.logoUrl} alt="Logo de la portada" />
                  </div>
                  {allowUploads ? (
                    <label className="file-field">
                      Subir logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        onChange={onMainLogoChange}
                      />
                    </label>
                  ) : null}
                </div>
                <div>
                  <p className="admin-panel__kicker">Footer / pestaña</p>
                  <div className="admin-logo-preview">
                    <img
                      src={draft.footer.logoUrl}
                      alt="Logo del footer"
                    />
                  </div>
                  {allowUploads ? (
                    <label className="file-field">
                      Subir emblema
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        onChange={onFooterLogoChange}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="admin-panel" id="parte-portada">
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

            <section className="admin-panel" id="parte-hero">
              <h2>Imagen hero de la portada</h2>
              <p className="admin-panel__hint">
                Foto de fondo del inicio. Si queda vacía, se ven el cielo y las
                colinas. Súbela en local con <code>npm run dev</code>.
              </p>
              <AdminHeroImage
                label="Portada"
                url={draft.hero.imageUrl}
                uploading={uploading}
                allowUploads={allowUploads}
                onPick={(e) =>
                  void onHeroImageChange(e, (url, current) => ({
                    ...current,
                    hero: { ...current.hero, imageUrl: url },
                  }))
                }
                onClear={() => {
                  const next = {
                    ...draft,
                    hero: { ...draft.hero, imageUrl: "" },
                  };
                  setDraft(next);
                  void persist(next);
                }}
              />
            </section>

            <details className="admin-details" id="parte-seo">
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
            <section className="admin-panel" id="parte-fecha">
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

            <section className="admin-panel" id="parte-agenda">
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

            <section className="admin-panel" id="parte-evento">
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

            <details className="admin-details" id="parte-inscripcion">
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
          <div className="admin-stack">
            <details className="admin-details" id="parte-sede" open>
              <summary>Sede</summary>
              <div className="admin-panel">
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
              </div>
            </details>
            <details className="admin-details" id="parte-suchitoto">
              <summary>Suchitoto 2024</summary>
              <div className="admin-panel">
            <p className="admin-panel__hint">
              Sube 4 o 5 fotos del último encuentro. Se muestran en la landing
              antes del botón de Instagram. Solo en local con{" "}
              <code>npm run dev</code>.
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta
                <input
                  value={draft.memories.eyebrow}
                  onChange={(e) => patchMemories({ eyebrow: e.target.value })}
                />
              </label>
              <label>
                Título
                <input
                  value={draft.memories.title}
                  onChange={(e) => patchMemories({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto
              <textarea
                rows={3}
                value={draft.memories.lead}
                onChange={(e) => patchMemories({ lead: e.target.value })}
              />
            </label>
            {allowUploads ? (
            <label className={`file-field${uploading ? " is-busy" : ""}`}>
              {uploading
                ? "Copiando…"
                : `Subir fotos (${draft.memories.images.length}/5)`}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                multiple
                disabled={uploading || draft.memories.images.length >= 5}
                onChange={(e) => void onMemoriesUpload(e)}
              />
            </label>
            ) : null}
            {draft.memories.images.length === 0 ? (
              <p className="admin-empty">
                Aún no hay fotos. Cuando las subas, la sección aparece en la
                landing.
              </p>
            ) : (
              <div className="admin-logos admin-logos--photos">
                {draft.memories.images.map((photo, index) => (
                  <div className="admin-logo-item" key={photo.id}>
                    <img src={photo.src} alt={photo.alt} />
                    <label>
                      Texto alternativo
                      <input
                        value={photo.alt}
                        onChange={(e) => {
                          const images = [...draft.memories.images];
                          images[index] = { ...photo, alt: e.target.value };
                          patchMemories({ images });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        patchMemories({
                          images: draft.memories.images.filter(
                            (item) => item.id !== photo.id,
                          ),
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
              </div>
            </details>
            <details className="admin-details" id="parte-jayaque">
              <summary>Jayaque 2026</summary>
              <div className="admin-panel">
            <p className="admin-panel__hint">
              Hashtag y fotos del lugar, debajo de Suchitoto. Sube hasta 5
              fotos. Solo en local con <code>npm run dev</code>.
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta
                <input
                  value={draft.destination.eyebrow}
                  onChange={(e) =>
                    patchDestination({ eyebrow: e.target.value })
                  }
                />
              </label>
              <label>
                Título
                <input
                  value={draft.destination.title}
                  onChange={(e) => patchDestination({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto
              <textarea
                rows={3}
                value={draft.destination.lead}
                onChange={(e) => patchDestination({ lead: e.target.value })}
              />
            </label>
            {allowUploads ? (
            <label className={`file-field${uploading ? " is-busy" : ""}`}>
              {uploading
                ? "Copiando…"
                : `Subir fotos (${draft.destination.images.length}/5)`}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                multiple
                disabled={uploading || draft.destination.images.length >= 5}
                onChange={(e) => void onDestinationUpload(e)}
              />
            </label>
            ) : null}
            {draft.destination.images.length === 0 ? (
              <p className="admin-empty">
                Aún no hay fotos de Jayaque. Cuando las subas, aparecen en la
                landing.
              </p>
            ) : (
              <div className="admin-logos admin-logos--photos">
                {draft.destination.images.map((photo, index) => (
                  <div className="admin-logo-item" key={photo.id}>
                    <img src={photo.src} alt={photo.alt} />
                    <label>
                      Texto alternativo
                      <input
                        value={photo.alt}
                        onChange={(e) => {
                          const images = [...draft.destination.images];
                          images[index] = { ...photo, alt: e.target.value };
                          patchDestination({ images });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() =>
                        patchDestination({
                          images: draft.destination.images.filter(
                            (item) => item.id !== photo.id,
                          ),
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
              </div>
            </details>
            <details className="admin-details" id="parte-instagram">
              <summary>Redes</summary>
              <div className="admin-panel">
                <p className="admin-panel__hint">
                  Instagram, Facebook, YouTube y TikTok se editan aquí y se
                  usan en la landing y en el pie. YouTube y TikTok no aparecen
                  en el sitio mientras la URL esté vacía.
                </p>
                <label>
                  Texto de la sección
                  <textarea
                    rows={2}
                    value={draft.instagram.lead}
                    onChange={(e) => patchInstagram({ lead: e.target.value })}
                  />
                </label>
                {SOCIAL_NETWORKS.map((network) => {
                  const item = withSocialDefaults(draft.footer.social).find(
                    (entry) => entry.id === network.id,
                  );
                  return (
                    <div className="admin-card" key={network.id}>
                      <p className="admin-panel__kicker">{network.name}</p>
                      {network.id === "youtube" || network.id === "tiktok" ? (
                        <p className="admin-panel__hint">
                          Déjalo vacío hasta que haya enlace. No se muestra en
                          el sitio si la URL está vacía.
                        </p>
                      ) : null}
                      <div className="admin-grid">
                        <label>
                          Usuario
                          <input
                            value={item?.handle || ""}
                            placeholder={network.handlePlaceholder}
                            onChange={(e) =>
                              patchSocial(network.id, { handle: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          URL
                          <input
                            value={item?.href || ""}
                            placeholder={network.hrefPlaceholder}
                            onChange={(e) =>
                              patchSocial(network.id, { href: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
            <details className="admin-details" id="parte-mapa">
              <summary>Mapa</summary>
              <div className="admin-panel">
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
              </div>
            </details>
          </div>
        )}

        {section === "album" && (
          <section className="admin-panel" id="parte-album">
            <h2>Álbum de recuerdos</h2>
            <p className="admin-panel__hint">
              {draft.album.images.length} foto
              {draft.album.images.length === 1 ? "" : "s"} en /recuerdos.
              {allowUploads
                ? " Sube varias a la vez; se guardan como 001, 002… y la página pública las muestra de a poco."
                : " En producción solo se edita texto y se pueden quitar fotos."}
            </p>
            <div className="admin-grid">
              <label>
                Etiqueta
                <input
                  value={draft.album.eyebrow}
                  onChange={(e) => patchAlbum({ eyebrow: e.target.value })}
                />
              </label>
              <label>
                Título
                <input
                  value={draft.album.title}
                  onChange={(e) => patchAlbum({ title: e.target.value })}
                />
              </label>
            </div>
            <label>
              Texto
              <textarea
                rows={2}
                value={draft.album.lead}
                onChange={(e) => patchAlbum({ lead: e.target.value })}
              />
            </label>
            <label>
              Invitación al álbum compartido
              <input
                value={draft.album.shareTitle}
                onChange={(e) => patchAlbum({ shareTitle: e.target.value })}
              />
            </label>
            <label>
              Texto de la invitación
              <textarea
                rows={2}
                value={draft.album.shareLead}
                onChange={(e) => patchAlbum({ shareLead: e.target.value })}
              />
            </label>
            <label>
              Texto del botón
              <input
                value={draft.album.shareCta}
                onChange={(e) => patchAlbum({ shareCta: e.target.value })}
              />
            </label>
            <label>
              Enlace de Google Photos
              <input
                value={draft.album.shareUrl}
                onChange={(e) => patchAlbum({ shareUrl: e.target.value })}
                placeholder="https://photos.app.goo.gl/…"
              />
            </label>
            {allowUploads ? (
              <label className={`file-field${uploading ? " is-busy" : ""}`}>
                {uploading
                  ? "Copiando…"
                  : `Subir fotos (${draft.album.images.length}/${ALBUM_MAX})`}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  multiple
                  disabled={uploading || draft.album.images.length >= ALBUM_MAX}
                  onChange={(e) => void onAlbumUpload(e)}
                />
              </label>
            ) : null}
            {draft.album.images.length === 0 ? (
              <p className="admin-empty">
                {allowUploads
                  ? "Aún no hay fotos. Sube varias a la vez."
                  : "El álbum está vacío."}
              </p>
            ) : (
              <div className="admin-album-grid">
                {draft.album.images.map((photo) => (
                  <figure className="admin-album-tile" key={photo.id}>
                    <img
                      src={thumbSrc(photo.src)}
                      alt={photo.alt || photo.caption || ""}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        if (event.currentTarget.src !== photo.src) {
                          event.currentTarget.src = photo.src;
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="admin-album-tile__remove"
                      aria-label="Quitar del álbum"
                      onClick={() => {
                        const next = {
                          ...draft,
                          album: {
                            ...draft.album,
                            images: draft.album.images.filter(
                              (item) => item.id !== photo.id,
                            ),
                          },
                        };
                        setDraft(next);
                        void persist(next);
                      }}
                    >
                      ×
                    </button>
                  </figure>
                ))}
              </div>
            )}
            <details className="admin-details admin-details--nested">
              <summary>Textos si el álbum está vacío</summary>
              <div className="admin-panel">
                <label>
                  Título
                  <input
                    value={draft.album.emptyTitle}
                    onChange={(e) =>
                      patchAlbum({ emptyTitle: e.target.value })
                    }
                  />
                </label>
                <label>
                  Texto
                  <input
                    value={draft.album.emptyText}
                    onChange={(e) => patchAlbum({ emptyText: e.target.value })}
                  />
                </label>
              </div>
            </details>
          </section>
        )}

        {section === "catechesis" && (
          <div className="admin-stack">
          <section className="admin-panel" id="parte-catequesis-hero">
            <h2>Imagen hero de catequesis</h2>
            <p className="admin-panel__hint">
              Banner de /catequesis, debajo del menú. Si queda vacía, la página
              empieza con el título. Súbela en local con <code>npm run dev</code>.
            </p>
            <AdminHeroImage
              label="Catequesis"
              url={draft.catechesis.heroImageUrl}
              uploading={uploading}
              allowUploads={allowUploads}
              onPick={(e) =>
                void onHeroImageChange(e, (url, current) => ({
                  ...current,
                  catechesis: { ...current.catechesis, heroImageUrl: url },
                }))
              }
              onClear={() => {
                const next = {
                  ...draft,
                  catechesis: { ...draft.catechesis, heroImageUrl: "" },
                };
                setDraft(next);
                void persist(next);
              }}
            />
          </section>
          <section className="admin-panel" id="parte-documentos">
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
            {allowUploads ? (
            <label className={`file-field${uploading ? " is-busy" : ""}`}>
              {uploading ? "Copiando…" : "Subir documentos"}
              <input
                type="file"
                multiple
                disabled={uploading}
                onChange={onCatechesisUpload}
              />
            </label>
            ) : (
              <p className="admin-panel__hint">
                En producción no se suben PDFs. Agrégalos en local con npm run
                dev.
              </p>
            )}
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
          </div>
        )}

        {section === "store" && (
          <div className="admin-stack">
            <section className="admin-panel" id="parte-tienda-logo">
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
              {allowUploads ? (
              <label className={`file-field${uploading ? " is-busy" : ""}`}>
                {uploading ? "Copiando…" : "Subir logo de tienda"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  disabled={uploading}
                  onChange={onStoreLogoChange}
                />
              </label>
              ) : (
                <p className="admin-panel__hint">
                  En producción no se sube el logo. Cárgalo en local.
                </p>
              )}
            </section>

            <section className="admin-panel" id="parte-tienda-textos">
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
              <p className="admin-panel__hint">
                El WhatsApp también recibe las donaciones de /donar.
              </p>
              <label>
                Nota de pago (transferencia)
                <textarea
                  rows={3}
                  value={draft.store.paymentNote}
                  onChange={(e) => patchStore({ paymentNote: e.target.value })}
                />
              </label>
            </section>

            <section className="admin-panel" id="parte-productos">
              <h2>Productos{productCount ? ` (${productCount})` : ""}</h2>
              <p className="admin-panel__hint">
                El stock se descuenta por talla y color al hacer un pedido. Si
                hay 5 camisas S, cada compra de S baja ese número. Color es
                opcional. Puedes subir varias fotos: en la tienda, al tocar el
                producto se abre el carrusel.
              </p>
              <div className="admin-inline-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    const id = createId("prod");
                    patchStore({
                      products: [
                        ...draft.store.products,
                        {
                          id,
                          title: "Camisa JDJ 2026",
                          description: "",
                          price: 10,
                          imageUrl: "",
                          imageUrls: [],
                          variants: defaultProductVariants(id),
                        },
                      ],
                    });
                    setOpenProduct(id);
                  }}
                >
                  Agregar producto
                </button>
              </div>
              {draft.store.products.length === 0 ? (
                <p className="admin-empty">Aún no hay productos.</p>
              ) : (
                draft.store.products.map((product, index) => {
                  const photos = productImages(product);
                  const isOpen = openProductId === product.id;
                  const total = productStock(product);
                  return (
                  <div
                    className={`admin-card admin-product${isOpen ? " is-open" : ""}`}
                    key={product.id}
                  >
                    <button
                      type="button"
                      className="admin-product__toggle"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenProduct(isOpen ? null : product.id)
                      }
                    >
                      {photos[0] ? (
                        <img
                          className="admin-product__thumb"
                          src={photos[0]}
                          alt=""
                        />
                      ) : (
                        <span className="admin-product__thumb is-empty">
                          JDJ
                        </span>
                      )}
                      <span className="admin-product__meta">
                        <strong>{product.title || "Producto sin título"}</strong>
                        <span>
                          {formatUsd(product.price)}
                          {" · "}
                          {total} {total === 1 ? "disponible" : "disponibles"}
                          {photos.length
                            ? ` · ${photos.length} ${photos.length === 1 ? "foto" : "fotos"}`
                            : ""}
                        </span>
                      </span>
                      <span className="admin-product__arrow" aria-hidden="true">
                        ▾
                      </span>
                    </button>
                    {isOpen ? (
                    <div className="admin-product__body">
                    {photos.length ? (
                      <div className="admin-product-gallery">
                        {photos.map((url, photoIndex) => (
                          <div
                            className={`admin-product-gallery__item${photoIndex === 0 ? " is-cover" : ""}`}
                            key={`${product.id}-${photoIndex}`}
                          >
                            <img src={url} alt="" />
                            {photoIndex === 0 ? (
                              <span>Portada</span>
                            ) : null}
                            <div className="admin-product-gallery__actions">
                              <button
                                type="button"
                                disabled={photoIndex === 0}
                                aria-label="Mover a la izquierda"
                                onClick={() =>
                                  patchProduct(
                                    index,
                                    withProductGallery(product, [
                                      ...photos.slice(0, photoIndex - 1),
                                      photos[photoIndex],
                                      photos[photoIndex - 1],
                                      ...photos.slice(photoIndex + 1),
                                    ]),
                                  )
                                }
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                disabled={photoIndex === photos.length - 1}
                                aria-label="Mover a la derecha"
                                onClick={() =>
                                  patchProduct(
                                    index,
                                    withProductGallery(product, [
                                      ...photos.slice(0, photoIndex),
                                      photos[photoIndex + 1],
                                      photos[photoIndex],
                                      ...photos.slice(photoIndex + 2),
                                    ]),
                                  )
                                }
                              >
                                ›
                              </button>
                              <button
                                type="button"
                                className="is-remove"
                                aria-label="Quitar foto"
                                onClick={() =>
                                  patchProduct(
                                    index,
                                    withProductGallery(
                                      product,
                                      photos.filter((item) => item !== url),
                                    ),
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {allowUploads ? (
                    <label className={`file-field${uploading ? " is-busy" : ""}`}>
                      {uploading ? "Copiando…" : "Agregar fotos"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        multiple
                        disabled={uploading}
                        onChange={(e) => void onProductImagesChange(index, e)}
                      />
                    </label>
                    ) : null}
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
                        Stock total
                        <input
                          value={productStock(product)}
                          readOnly
                        />
                      </label>
                    </div>
                    <div className="admin-variants">
                      <div className="admin-variants__head">
                        <span>Talla</span>
                        <span>Color</span>
                        <span>Stock</span>
                        <span />
                      </div>
                      {product.variants.map((variant, variantIndex) => (
                        <div className="admin-variants__row" key={variant.id}>
                          <input
                            value={variant.size}
                            placeholder="S"
                            onChange={(e) =>
                              patchVariant(index, variantIndex, {
                                size: e.target.value,
                              })
                            }
                          />
                          <input
                            value={variant.color}
                            placeholder="Azul"
                            onChange={(e) =>
                              patchVariant(index, variantIndex, {
                                color: e.target.value,
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={variant.stock}
                            onChange={(e) =>
                              patchVariant(index, variantIndex, {
                                stock: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                          <button
                            type="button"
                            className="btn btn--danger"
                            onClick={() =>
                              patchProduct(index, {
                                variants: product.variants.filter(
                                  (item) => item.id !== variant.id,
                                ),
                              })
                            }
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        patchProduct(index, {
                          variants: [
                            ...product.variants,
                            {
                              id: createId("var"),
                              size: "",
                              color: "",
                              stock: 0,
                            },
                          ],
                        })
                      }
                    >
                      Agregar talla o color
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => {
                        patchStore({
                          products: draft.store.products.filter(
                            (item) => item.id !== product.id,
                          ),
                        });
                        if (openProductId === product.id) setOpenProduct(null);
                      }}
                    >
                      Quitar producto
                    </button>
                    </div>
                    ) : null}
                  </div>
                  );
                })
              )}
            </section>
          </div>
        )}

        {section === "orders" && (
          <section className="admin-panel" id="parte-pedidos">
            <h2>Pedidos{orders.length ? ` (${orders.length})` : ""}</h2>
            <p className="admin-panel__hint">
              Cada compra llega aquí y se abre WhatsApp con el pedido. El pago
              es por transferencia. El stock se descuenta por talla y color;
              si cancelas, se devuelve a esa variante.
              {ordersPersist === "memory"
                ? " En producción, configura GITHUB_TOKEN si quieres conservarlos entre deploys."
                : ordersPersist === "file"
                  ? " En local se guardan en src/data/savedOrders.ts."
                  : ""}
            </p>
            <div className="admin-report">
              <article className="admin-report__card">
                <p>Pedidos</p>
                <strong>{orderReport.total}</strong>
                <span>
                  {orderReport.byStatus.nuevo} nuevos ·{" "}
                  {orderReport.byStatus.atendido} atendidos ·{" "}
                  {orderReport.byStatus.cancelado} cancelados
                </span>
              </article>
              <article className="admin-report__card">
                <p>Unidades vendidas</p>
                <strong>{orderReport.units}</strong>
                <span>Sin contar cancelados</span>
              </article>
              <article className="admin-report__card">
                <p>Total</p>
                <strong>{formatUsd(orderReport.revenue)}</strong>
                <span>Transferencias registradas</span>
              </article>
            </div>
            {orderReport.lines.length ? (
              <div className="admin-stock-table-wrap">
                <table className="admin-stock-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Variante</th>
                      <th>Vendidas</th>
                      <th>Quedan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderReport.lines.map((line) => (
                      <tr key={`${line.productId}-${line.variantId}`}>
                        <td>{line.productTitle}</td>
                        <td>{variantLabel(line)}</td>
                        <td>{line.sold}</td>
                        <td>{line.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
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
                    {order.color ? ` · ${order.color}` : ""}
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

        {section === "donations" && (
          <div className="admin-stack">
          <section className="admin-panel" id="parte-donar-hero">
            <h2>Imagen hero de donar</h2>
            <p className="admin-panel__hint">
              Banner de /donar, debajo del menú. Si queda vacía, la página
              empieza con el formulario. Súbela en local con{" "}
              <code>npm run dev</code>.
            </p>
            <AdminHeroImage
              label="Donar"
              url={draft.donate.heroImageUrl}
              uploading={uploading}
              allowUploads={allowUploads}
              onPick={(e) =>
                void onHeroImageChange(e, (url, current) => ({
                  ...current,
                  donate: { ...current.donate, heroImageUrl: url },
                }))
              }
              onClear={() => {
                const next = {
                  ...draft,
                  donate: { ...draft.donate, heroImageUrl: "" },
                };
                setDraft(next);
                void persist(next);
              }}
            />
          </section>
          <section className="admin-panel" id="parte-donaciones">
            <h2>Donaciones{donations.length ? ` (${donations.length})` : ""}</h2>
            <p className="admin-panel__hint">
              Cada aporte llega por WhatsApp y se paga por transferencia
              bancaria. Queda pendiente hasta que confirmes el comprobante. El
              total solo suma donaciones pagadas ($5 a $25).
            </p>
            <div className="admin-report">
              <article className="admin-report__card">
                <p>Registros</p>
                <strong>{donations.length}</strong>
                <span>
                  {donations.filter((item) => item.status === "pending").length}{" "}
                  pendientes ·{" "}
                  {donations.filter((item) => item.status === "paid").length}{" "}
                  pagadas
                </span>
              </article>
              <article className="admin-report__card">
                <p>Recaudado</p>
                <strong>{formatUsd(donationsTotal)}</strong>
                <span>Solo pagos confirmados</span>
              </article>
            </div>
            <div className="admin-inline-actions">
              <label>
                Estado
                <select
                  value={donationFilter}
                  onChange={(e) =>
                    setDonationFilter(e.target.value as "all" | DonationStatus)
                  }
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagada</option>
                  <option value="failed">Fallida</option>
                  <option value="expired">Vencida</option>
                </select>
              </label>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={!donations.length}
                onClick={() =>
                  downloadJson("jdj2026-donaciones.json", donations)
                }
              >
                Exportar JSON
              </button>
            </div>
            {donationsNotice ? (
              <p className="admin-panel__hint">{donationsNotice}</p>
            ) : null}
            {donations.filter(
              (item) =>
                donationFilter === "all" || item.status === donationFilter,
            ).length === 0 ? (
              <p className="admin-empty">Aún no hay donaciones en este filtro.</p>
            ) : (
              donations
                .filter(
                  (item) =>
                    donationFilter === "all" || item.status === donationFilter,
                )
                .map((donation) => (
                  <article className="admin-order" key={donation.id}>
                    <div className="admin-order__top">
                      <strong>{formatUsd(Number(donation.amount))}</strong>
                      <span
                        className={`admin-order__status is-${donation.status}`}
                      >
                        {donationStatusLabel(donation.status)}
                      </span>
                    </div>
                    <p>
                      {donation.full_name}
                      {donation.dui ? ` · DUI ${donation.dui}` : ""}
                    </p>
                    <p>
                      {donation.email}
                      {donation.phone ? ` · ${donation.phone}` : ""}
                    </p>
                    <p>{donation.parish}</p>
                    <p>
                      {donation.payment_method || "Transferencia"}
                    </p>
                    <p className="admin-order__date">
                      {formatOrderDate(donation.created_at)}
                      {donation.paid_at
                        ? ` · pagada ${formatOrderDate(donation.paid_at)}`
                        : ""}
                    </p>
                    <div className="admin-inline-actions">
                      {donation.status !== "paid" ? (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() =>
                            void patchDonationStatus(donation.id, "paid")
                          }
                        >
                          Marcar pagada
                        </button>
                      ) : null}
                      {donation.status !== "pending" ? (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() =>
                            void patchDonationStatus(donation.id, "pending")
                          }
                        >
                          Marcar pendiente
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
            )}
          </section>
          </div>
        )}

        {section === "page" && (
          <div className="admin-stack">
            <section className="admin-panel" id="parte-about">
              <h2>Qué es la JDJ</h2>
              <p className="admin-panel__hint">
                Texto de la sección que explica el encuentro, debajo de la sede.
              </p>
              <div className="admin-grid">
                <label>
                  Etiqueta
                  <input
                    value={draft.about.eyebrow}
                    onChange={(e) => patchAbout({ eyebrow: e.target.value })}
                  />
                </label>
                <label>
                  Título
                  <input
                    value={draft.about.title}
                    onChange={(e) => patchAbout({ title: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Entrada
                <textarea
                  rows={3}
                  value={draft.about.lead}
                  onChange={(e) => patchAbout({ lead: e.target.value })}
                />
              </label>
              <label>
                Texto
                <textarea
                  rows={5}
                  value={draft.about.body}
                  onChange={(e) => patchAbout({ body: e.target.value })}
                />
              </label>
            </section>

            <section className="admin-panel" id="parte-faq">
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

            <section className="admin-panel" id="parte-logo-significado">
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

            <section className="admin-panel" id="parte-partners">
              <h2>Nos Acompañan{partnerCount ? ` (${partnerCount})` : ""}</h2>
              {allowUploads ? (
              <label className="file-field">
                Subir logos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPartnerUpload}
                />
              </label>
              ) : (
                <p className="admin-panel__hint">
                  En producción no se suben logos. Agrégalos en local.
                </p>
              )}
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

            <details className="admin-details" id="parte-pie">
              <summary>Pie y vicarías</summary>
              <div className="admin-panel">
                <p className="admin-panel__hint">
                  Las redes se editan en Sede → Redes.
                </p>
                <label>
                  Organización
                  <input
                    value={draft.footer.org}
                    onChange={(e) => patchFooter({ org: e.target.value })}
                  />
                </label>
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
