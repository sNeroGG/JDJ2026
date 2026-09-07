import { useEffect } from "react";
import { useTeam } from "../context/TeamContext";
import "./PreviewBanner.css";

export function PreviewBanner() {
  const { setViewingAsPublic } = useTeam();

  useEffect(() => {
    document.documentElement.classList.add("has-preview-banner");
    return () => document.documentElement.classList.remove("has-preview-banner");
  }, []);

  return (
    <p className="preview-banner" role="status">
      Vista interna del equipo. El público solo ve{" "}
      <strong>Próximamente</strong>.{" "}
      <button type="button" onClick={() => setViewingAsPublic(true)}>
        Ver para público
      </button>
    </p>
  );
}
