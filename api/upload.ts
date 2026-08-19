import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4.5mb",
    },
  },
};

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "jdj2026";
}

function blobHelp(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("token") || lower.includes("oidc") || lower.includes("auth")) {
    return "Blob no autenticó. En Vercel: Storage → Blob → Connect to Project, y Redeploy. Si hace falta, copia BLOB_READ_WRITE_TOKEN del store a Environment Variables.";
  }
  return message;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function POST(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token || token !== adminPassword()) {
    return json(
      { error: "No autorizado. Cierra sesión en /admin y vuelve a entrar." },
      401,
    );
  }

  const body = (await request.json().catch(() => null)) as {
    filename?: string;
    contentType?: string;
    data?: string;
  } | null;

  const filename = typeof body?.filename === "string" ? body.filename : "";
  const contentType =
    typeof body?.contentType === "string"
      ? body.contentType
      : "application/octet-stream";
  const data = typeof body?.data === "string" ? body.data : "";

  if (!filename || !data) {
    return json({ error: "Archivo incompleto" }, 400);
  }

  try {
    const buffer = Buffer.from(data, "base64");
    const blob = await put(`jdj/${Date.now()}-${filename}`, buffer, {
      access: "private",
      addRandomSuffix: true,
      contentType,
    });
    return json({
      url: `/api/file?pathname=${encodeURIComponent(blob.pathname)}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir a Blob";
    return json({ error: blobHelp(message) }, 500);
  }
}
