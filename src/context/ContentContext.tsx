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
  AUTH_SECRET_KEY,
  DEFAULT_CONTENT,
  type RegistrationStatus,
  type SavedContent,
  type SiteContent,
} from "../data/defaultContent";
import { SAVED_CONTENT } from "../data/savedContent";

const REGISTRATION_STATUSES: RegistrationStatus[] = ["soon", "open", "closed"];

type ContentContextValue = {
  content: SiteContent;
  setContent: (next: SiteContent) => void;
  updateContent: (updater: (prev: SiteContent) => SiteContent) => void;
  saveContent: (next?: SiteContent) => Promise<void>;
  resetContent: () => Promise<void>;
  isAuthenticated: boolean;
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

function isHostedUrl(value: string) {
  return Boolean(value) && !value.startsWith("data:");
}

function mergeContent(parsed: SavedContent): SiteContent {
  return {
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
    schedule: {
      ...DEFAULT_CONTENT.schedule,
      ...parsed.schedule,
      days: parsed.schedule?.days ?? DEFAULT_CONTENT.schedule.days,
    },
    registration: {
      ...DEFAULT_CONTENT.registration,
      ...parsed.registration,
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
    header: {
      ...DEFAULT_CONTENT.header,
      ...parsed.header,
      ctaHref: catechesisPath(
        parsed.header?.ctaHref ?? DEFAULT_CONTENT.header.ctaHref,
      ),
      nav: withCatechesisRoute(
        parsed.header?.nav?.length &&
          !parsed.header.nav.some((item) => item.id === "nav-inicio")
          ? parsed.header.nav
          : DEFAULT_CONTENT.header.nav,
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
      nav: withCatechesisRoute(
        parsed.footer?.nav?.length
          ? parsed.footer.nav
          : DEFAULT_CONTENT.footer.nav,
      ),
      social: parsed.footer?.social?.length
        ? parsed.footer.social
        : DEFAULT_CONTENT.footer.social,
    },
  };
}

function loadContent(): SiteContent {
  return mergeContent(SAVED_CONTENT);
}

function loadAuth(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function getAdminPassword() {
  return import.meta.env.VITE_ADMIN_PASSWORD || "jdj2026";
}

function authHeader() {
  const password = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
  return { Authorization: `Bearer ${password}` };
}

async function saveLocally(content: SiteContent) {
  if (!import.meta.env.DEV) {
    throw new Error(
      "Los archivos se guardan en el proyecto en local. Corre npm run dev, guarda, y sube el commit a GitHub para Vercel.",
    );
  }
  const remote = await fetch("/__admin/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ content }),
  });
  const payload = (await remote.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!remote.ok) {
    throw new Error(payload?.error || "No se pudo guardar en el proyecto.");
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(loadContent);
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadAuth());

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
    const value = next ?? content;
    setContentState(value);
    await saveLocally(value);
  }, [content]);

  const resetContent = useCallback(async () => {
    setContentState(DEFAULT_CONTENT);
    await saveLocally(DEFAULT_CONTENT);
  }, []);

  const login = useCallback(async (password: string) => {
    const ok = password === getAdminPassword();
    if (ok) {
      sessionStorage.setItem(AUTH_KEY, "1");
      sessionStorage.setItem(AUTH_SECRET_KEY, password);
      setIsAuthenticated(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_SECRET_KEY);
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
