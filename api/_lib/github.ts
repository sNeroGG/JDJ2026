const GITHUB_API = "https://api.github.com";

export type CommitResult =
  | { ok: true; sha?: string }
  | { ok: false; error: string };

type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

function readConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner =
    process.env.GITHUB_REPO_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME || process.env.VERCEL_GIT_REPO_SLUG;
  const branch =
    process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
  if (!token || !owner || !repo) return null;
  return { token, owner, repo, branch };
}

export function isGithubConfigured() {
  return readConfig() !== null;
}

export function persistKind() {
  return isGithubConfigured() ? "github" : "memory";
}

/**
 * Escribe un archivo del repo con la Contents API de GitHub. El push resultante
 * dispara el redeploy de Vercel, que es lo que publica el cambio.
 */
export async function commitFile(
  filePath: string,
  contents: string,
  message: string,
): Promise<CommitResult> {
  const config = readConfig();
  if (!config) {
    return {
      ok: false,
      error:
        "Falta configurar GITHUB_TOKEN en Vercel para publicar desde el sitio.",
    };
  }

  const endpoint = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "jdj2026-admin",
  };

  try {
    // La Contents API exige el sha actual para sobrescribir un archivo existente.
    const existing = await fetch(
      `${endpoint}?ref=${encodeURIComponent(config.branch)}`,
      { headers },
    );
    if (!existing.ok && existing.status !== 404) {
      return {
        ok: false,
        error: `GitHub respondió ${existing.status} al leer ${filePath}.`,
      };
    }
    const current = existing.ok
      ? ((await existing.json().catch(() => null)) as { sha?: string } | null)
      : null;

    const put = await fetch(endpoint, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: Buffer.from(contents).toString("base64"),
        branch: config.branch,
        sha: current?.sha,
      }),
    });

    if (!put.ok) {
      const detail = (await put.json().catch(() => null)) as {
        message?: string;
      } | null;
      return {
        ok: false,
        error: detail?.message || `GitHub respondió ${put.status}.`,
      };
    }

    const saved = (await put.json().catch(() => null)) as {
      commit?: { sha?: string };
    } | null;
    return { ok: true, sha: saved?.commit?.sha };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo contactar GitHub.",
    };
  }
}
