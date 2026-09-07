import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  TEAM_AUTH_KEY,
  TEAM_SECRET_KEY,
  loadTeamAuth,
} from "../utils/teamAccess";

type TeamContextValue = {
  isTeamAuthenticated: boolean;
  viewingAsPublic: boolean;
  setViewingAsPublic: (next: boolean) => void;
  unlockTeam: (password: string) => Promise<{ ok: boolean; error?: string }>;
};

const TeamContext = createContext<TeamContextValue | null>(null);

const PUBLIC_VIEW_KEY = "jdj2026-public-view";

export function TeamProvider({ children }: { children: ReactNode }) {
  const [isTeamAuthenticated, setIsTeamAuthenticated] = useState(() =>
    loadTeamAuth(),
  );
  const [viewingAsPublic, setViewingAsPublicState] = useState(
    () => sessionStorage.getItem(PUBLIC_VIEW_KEY) === "1",
  );

  const setViewingAsPublic = useCallback((next: boolean) => {
    if (next) sessionStorage.setItem(PUBLIC_VIEW_KEY, "1");
    else sessionStorage.removeItem(PUBLIC_VIEW_KEY);
    setViewingAsPublicState(next);
  }, []);

  const unlockTeam = useCallback(async (password: string) => {
    const pin = password.trim();
    const remote = await fetch("/api/team-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, password: pin }),
    }).catch(() => null);
    if (!remote) return { ok: false, error: "No se pudo conectar." };
    const payload = (await remote.json().catch(() => null)) as {
      error?: string;
      token?: string;
    } | null;
    if (!remote.ok || !payload?.token) {
      return {
        ok: false,
        error: payload?.error || "Clave incorrecta",
      };
    }
    sessionStorage.setItem(TEAM_AUTH_KEY, "1");
    sessionStorage.setItem(TEAM_SECRET_KEY, payload.token);
    sessionStorage.removeItem(PUBLIC_VIEW_KEY);
    setViewingAsPublicState(false);
    setIsTeamAuthenticated(true);
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({
      isTeamAuthenticated,
      viewingAsPublic,
      setViewingAsPublic,
      unlockTeam,
    }),
    [isTeamAuthenticated, viewingAsPublic, setViewingAsPublic, unlockTeam],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error("useTeam debe usarse dentro de TeamProvider");
  }
  return ctx;
}
