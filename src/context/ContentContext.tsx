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
  DEFAULT_CONTENT,
  STORAGE_KEY,
  type SiteContent,
} from "../data/defaultContent";

type ContentContextValue = {
  content: SiteContent;
  setContent: (next: SiteContent) => void;
  updateContent: (updater: (prev: SiteContent) => SiteContent) => void;
  saveContent: (next?: SiteContent) => void;
  resetContent: () => void;
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function mergeContent(parsed: Partial<SiteContent>): SiteContent {
  return {
    ...DEFAULT_CONTENT,
    ...parsed,
    logoUrl: parsed.logoUrl || DEFAULT_CONTENT.logoUrl,
    site: { ...DEFAULT_CONTENT.site, ...parsed.site },
    hero: { ...DEFAULT_CONTENT.hero, ...parsed.hero },
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
      logos: parsed.partners?.logos ?? DEFAULT_CONTENT.partners.logos,
    },
    footer: {
      ...DEFAULT_CONTENT.footer,
      ...parsed.footer,
      nav: parsed.footer?.nav?.length
        ? parsed.footer.nav
        : DEFAULT_CONTENT.footer.nav,
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

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(() => loadContent());
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

  const saveContent = useCallback((next?: SiteContent) => {
    setContentState((prev) => {
      const value = next ?? prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return value;
    });
  }, []);

  const resetContent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setContentState(DEFAULT_CONTENT);
  }, []);

  const login = useCallback((password: string) => {
    const ok = password === getAdminPassword();
    if (ok) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setIsAuthenticated(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
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
