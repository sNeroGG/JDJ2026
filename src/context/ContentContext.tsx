import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_KEY,
  AUTH_SECRET_KEY,
  DEFAULT_CONTENT,
  STORAGE_KEY,
  type SiteContent,
} from "../data/defaultContent";

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

function mergeContent(parsed: Partial<SiteContent>): SiteContent {
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTENT;
    return mergeContent(JSON.parse(raw) as Partial<SiteContent>);
  } catch {
    return DEFAULT_CONTENT;
  }
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

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(DEFAULT_CONTENT);
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadAuth());

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const remote = await fetch("/api/content");
        if (remote.ok) {
          const data = mergeContent(
            (await remote.json()) as Partial<SiteContent>,
          );
          if (!cancelled) setContentState(data);
          return;
        }
      } catch {
        // local / sin Blob
      }
      if (!cancelled) setContentState(loadContent());
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    try {
      const remote = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(value),
      });
      if (!remote.ok && remote.status !== 404) {
        const payload = (await remote.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (remote.status === 401) {
          throw new Error("No autorizado para guardar en Vercel.");
        }
        if (payload?.error && remote.status >= 500) {
          throw new Error(
            "No se pudo guardar en Vercel Blob. Revisa el Blob Store.",
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("No ")) {
        throw error;
      }
    }
  }, [content]);

  const resetContent = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setContentState(DEFAULT_CONTENT);
    try {
      await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(DEFAULT_CONTENT),
      });
    } catch {
      // local
    }
  }, []);

  const login = useCallback(async (password: string) => {
    let ok = password === getAdminPassword();
    try {
      const remote = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (remote.ok && remote.headers.get("content-type")?.includes("json")) {
        ok = true;
      } else if (remote.status === 401) {
        ok = false;
      }
    } catch {
      // sin API (local)
    }
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
