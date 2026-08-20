import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_KEY,
  AUTH_PUBLISH_KEY,
  AUTH_SECRET_KEY,
  DEFAULT_CONTENT,
  type NavLink,
  type RegistrationStatus,
  type SavedContent,
  type ScheduleItem,
  type SiteContent,
} from "../data/defaultContent";
import { SAVED_CONTENT } from "../data/savedContent";
import { capitalizeDioceseTermsIn } from "../utils/copy";
import { normalizeInstagramPosts } from "../utils/instagram";
import { normalizeStoreProducts } from "../utils/store";

const REGISTRATION_STATUSES: RegistrationStatus[] = ["soon", "open", "closed"];

/** `local` escribe el archivo del repo; `github` lo commitea y dispara el redeploy. */
export type SaveMode = "local" | "github";

type ContentContextValue = {
  content: SiteContent;
  setContent: (next: SiteContent) => void;
  updateContent: (updater: (prev: SiteContent) => SiteContent) => void;
  saveContent: (next?: SiteContent) => Promise<SaveMode>;
  resetContent: () => Promise<SaveMode>;
  isAuthenticated: boolean;
  canPublish: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function catechesisPath(href: string) {
  return href === "#catequesis" ? "/catequesis" : href;
}

function withCatechesisRoute<T extends { href: string }>(items: T[]) {
  return items.map((item) => ({ ...item, href: catechesisPath(item.href) }));
}

const STORE_NAV: NavLink = {
  id: "nav-tienda",
  href: "/tienda",
  label: "Tienda",
};

function withStoreNav<T extends NavLink>(items: T[]) {
  if (items.some((item) => item.href === "/tienda" || item.id === "nav-tienda")) {
    return items;
  }
  const catechesisAt = items.findIndex(
    (item) => item.href === "/catequesis" || item.id === "nav-catequesis",
  );
  if (catechesisAt >= 0) {
    return [
      ...items.slice(0, catechesisAt),
      STORE_NAV as T,
      ...items.slice(catechesisAt),
    ];
  }
  return [...items, STORE_NAV as T];
}

function isHostedUrl(value: string) {
  return Boolean(value) && !value.startsWith("data:");
}

type LegacySchedule = NonNullable<SavedContent["schedule"]> & {
  endDate?: string;
  days?: { items?: ScheduleItem[] }[];
};

/** La agenda es de un día: usa `items` o aplana días viejos si todavía existían. */
function resolveScheduleItems(parsed: SavedContent): ScheduleItem[] {
  const schedule = parsed.schedule as LegacySchedule | undefined;
  if (Array.isArray(schedule?.items)) return schedule.items;
  if (schedule?.days?.length) {
    return schedule.days.flatMap((day) => day.items ?? []);
  }
  return DEFAULT_CONTENT.schedule.items;
}

function mergeSchedule(parsed: SavedContent): SiteContent["schedule"] {
  const raw = { ...(parsed.schedule as LegacySchedule | undefined) };
  delete raw.days;
  delete raw.endDate;
  return {
    ...DEFAULT_CONTENT.schedule,
    ...raw,
    items: resolveScheduleItems(parsed),
  };
}

function mergeContent(parsed: SavedContent): SiteContent {
  const merged: SiteContent = {
    ...DEFAULT_CONTENT,
    ...parsed,
    logoUrl:
      parsed.logoUrl && isHostedUrl(parsed.logoUrl)
        ? parsed.logoUrl
        : DEFAULT_CONTENT.logoUrl,
    site: { ...DEFAULT_CONTENT.site, ...parsed.site },
    hero: {
      ...DEFAULT_CONTENT.hero,
      ...parsed.hero,
      highlights: withCatechesisRoute(
        parsed.hero?.highlights?.length
          ? parsed.hero.highlights
          : DEFAULT_CONTENT.hero.highlights,
      ),
    },
    location: {
      ...DEFAULT_CONTENT.location,
      ...parsed.location,
      facts: parsed.location?.facts?.length
        ? parsed.location.facts
        : DEFAULT_CONTENT.location.facts,
    },
    instagram: {
      ...DEFAULT_CONTENT.instagram,
      ...parsed.instagram,
      posts: normalizeInstagramPosts(
        Array.isArray(parsed.instagram?.posts)
          ? parsed.instagram.posts
          : DEFAULT_CONTENT.instagram.posts,
      ).map((post) => ({
        ...post,
        imageUrl:
          post.imageUrl && isHostedUrl(post.imageUrl) ? post.imageUrl : "",
      })),
    },
    schedule: mergeSchedule(parsed),
    registration: {
      ...DEFAULT_CONTENT.registration,
      ...parsed.registration,
      enabled: parsed.registration?.enabled ?? DEFAULT_CONTENT.registration.enabled,
      status: REGISTRATION_STATUSES.includes(
        parsed.registration?.status as RegistrationStatus,
      )
        ? (parsed.registration?.status as RegistrationStatus)
        : DEFAULT_CONTENT.registration.status,
      steps: parsed.registration?.steps ?? DEFAULT_CONTENT.registration.steps,
    },
    faq: {
      ...DEFAULT_CONTENT.faq,
      ...parsed.faq,
      items: parsed.faq?.items ?? DEFAULT_CONTENT.faq.items,
    },
    vicariates: {
      ...DEFAULT_CONTENT.vicariates,
      ...parsed.vicariates,
      items: parsed.vicariates?.items ?? DEFAULT_CONTENT.vicariates.items,
    },
    meaning: {
      ...DEFAULT_CONTENT.meaning,
      ...parsed.meaning,
      elements: parsed.meaning?.elements?.length
        ? parsed.meaning.elements
        : DEFAULT_CONTENT.meaning.elements,
    },
    event: {
      ...DEFAULT_CONTENT.event,
      ...parsed.event,
      items: parsed.event?.items?.length
        ? parsed.event.items
        : DEFAULT_CONTENT.event.items,
    },
    partners: {
      ...DEFAULT_CONTENT.partners,
      ...parsed.partners,
      logos: (parsed.partners?.logos ?? DEFAULT_CONTENT.partners.logos).filter(
        (logo) => isHostedUrl(logo.src),
      ),
    },
    store: {
      ...DEFAULT_CONTENT.store,
      ...parsed.store,
      logoUrl:
        parsed.store?.logoUrl && isHostedUrl(parsed.store.logoUrl)
          ? parsed.store.logoUrl
          : parsed.store?.logoUrl === ""
            ? ""
            : DEFAULT_CONTENT.store.logoUrl,
      products: normalizeStoreProducts(
        (parsed.store?.products ?? DEFAULT_CONTENT.store.products).filter(
          (product) => !product.imageUrl || isHostedUrl(product.imageUrl),
        ),
      ),
    },
    header: {
      ...DEFAULT_CONTENT.header,
      ...parsed.header,
      ctaHref: catechesisPath(
        parsed.header?.ctaHref ?? DEFAULT_CONTENT.header.ctaHref,
      ),
      nav: withStoreNav(
        withCatechesisRoute(
          parsed.header?.nav?.length &&
            !parsed.header.nav.some((item) => item.id === "nav-inicio")
            ? parsed.header.nav
            : DEFAULT_CONTENT.header.nav,
        ),
      ),
    },
    catechesis: {
      ...DEFAULT_CONTENT.catechesis,
      ...parsed.catechesis,
      docs: (parsed.catechesis?.docs ?? DEFAULT_CONTENT.catechesis.docs).filter(
        (doc) => !doc.href || isHostedUrl(doc.href),
      ),
    },
    footer: {
      ...DEFAULT_CONTENT.footer,
      ...parsed.footer,
      logoUrl:
        parsed.footer?.logoUrl && isHostedUrl(parsed.footer.logoUrl)
          ? parsed.footer.logoUrl
          : DEFAULT_CONTENT.footer.logoUrl,
      nav: withStoreNav(
        withCatechesisRoute(
          parsed.footer?.nav?.length
            ? parsed.footer.nav
            : DEFAULT_CONTENT.footer.nav,
        ),
      ),
      social: parsed.footer?.social?.length
        ? parsed.footer.social
        : DEFAULT_CONTENT.footer.social,
    },
  };
  return capitalizeDioceseTermsIn(merged);
}

function loadContent(): SiteContent {
  return mergeContent(SAVED_CONTENT);
}

function loadAuth(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function loadCanPublish(): boolean {
  return import.meta.env.DEV || sessionStorage.getItem(AUTH_PUBLISH_KEY) !== "0";
}

function authHeader() {
  const password = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
  return { Authorization: `Bearer ${password}` };
}

async function persistContent(content: SiteContent): Promise<SaveMode> {
  const remote = await fetch("/api/content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ content }),
  });
  const payload = (await remote.json().catch(() => null)) as {
    error?: string;
    mode?: SaveMode;
  } | null;
  if (!remote.ok) {
    throw new Error(payload?.error || "No se pudo guardar el contenido.");
  }
  return payload?.mode === "github" ? "github" : "local";
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(loadContent);
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadAuth());
  const [canPublish, setCanPublish] = useState(() => loadCanPublish());

  const setContent = useCallback((next: SiteContent) => {
    setContentState(next);
  }, []);

  const updateContent = useCallback(
    (updater: (prev: SiteContent) => SiteContent) => {
      setContentState((prev) => updater(prev));
    },
    [],
  );

  const saveContent = useCallback(async (next?: SiteContent) => {
    const value = capitalizeDioceseTermsIn(next ?? content);
    setContentState(value);
    return persistContent(value);
  }, [content]);

  const resetContent = useCallback(async () => {
    setContentState(DEFAULT_CONTENT);
    return persistContent(DEFAULT_CONTENT);
  }, []);

  const login = useCallback(async (password: string) => {
    const remote = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (!remote?.ok) return false;

    const payload = (await remote.json().catch(() => null)) as {
      canPublish?: boolean;
    } | null;
    const publishable = import.meta.env.DEV || payload?.canPublish === true;
    sessionStorage.setItem(AUTH_KEY, "1");
    sessionStorage.setItem(AUTH_SECRET_KEY, password);
    sessionStorage.setItem(AUTH_PUBLISH_KEY, publishable ? "1" : "0");
    setIsAuthenticated(true);
    setCanPublish(publishable);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_SECRET_KEY);
    sessionStorage.removeItem(AUTH_PUBLISH_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      content,
      setContent,
      updateContent,
      saveContent,
      resetContent,
      isAuthenticated,
      canPublish,
      login,
      logout,
    }),
    [
      content,
      setContent,
      updateContent,
      saveContent,
      resetContent,
      isAuthenticated,
      canPublish,
      login,
      logout,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useContent debe usarse dentro de ContentProvider");
  }
  return ctx;
}
