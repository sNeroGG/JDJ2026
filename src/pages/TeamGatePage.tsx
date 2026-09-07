import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import { useTeam } from "../context/TeamContext";
import { useSeo } from "../hooks/useSeo";
import { isComingSoonActive } from "../utils/comingSoon";
import { TEAM_ROUTE } from "../utils/teamAccess";
import "./TeamGatePage.css";

export function TeamGatePage() {
  const { content, isAuthenticated } = useContent();
  const { isTeamAuthenticated, unlockTeam } = useTeam();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useSeo({
    title: `Equipo — ${content.site.pageTitle}`,
    description:
      "Entrada del equipo de la Jornada Diocesana de la Juventud de la Arquidiócesis de San Salvador.",
    path: TEAM_ROUTE,
    siteUrl: content.site.url,
    image: content.site.ogImage,
    robots: "noindex, nofollow, noarchive",
  });

  if (!isComingSoonActive() || isTeamAuthenticated || isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await unlockTeam(password);
    setBusy(false);
    setError(result.ok ? "" : result.error || "Clave incorrecta");
    if (result.ok) setPassword("");
  }

  return (
    <div className="team-gate">
      <form className="team-gate__card" onSubmit={handleSubmit}>
        <img
          className="team-gate__logo"
          src={content.logoUrl}
          alt="JDJ Jayaque 2026 — Arquidiócesis de San Salvador"
          width={1200}
          height={689}
        />
        <p className="team-gate__kicker">Equipo</p>
        <h1>Entrada del equipo</h1>
        <p>
          Esta clave abre la vista interna de la Jornada Diocesana de la
          Juventud de la Arquidiócesis de San Salvador. No es el panel de
          publicación.
        </p>
        <label>
          PIN del equipo
          <input
            type="password"
            name="pin"
            inputMode="text"
            autoComplete="one-time-code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </label>
        {error ? <p className="team-gate__error">{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
