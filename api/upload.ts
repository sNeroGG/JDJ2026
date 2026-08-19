import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método no permitido" });
  }

  const token = String(request.headers.authorization || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token || token !== adminPassword()) {
    return response.status(401).json({
      error: "No autorizado. Cierra sesión en /admin y vuelve a entrar.",
    });
  }

  const filename =
    typeof request.body?.filename === "string" ? request.body.filename : "";
  const contentType =
    typeof request.body?.contentType === "string"
      ? request.body.contentType
      : "application/octet-stream";
  const data = typeof request.body?.data === "string" ? request.body.data : "";

  if (!filename || !data) {
    return response.status(400).json({ error: "Archivo incompleto" });
  }

  try {
    const buffer = Buffer.from(data, "base64");
    const blob = await put(`jdj/${Date.now()}-${filename}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return response.status(200).json({ url: blob.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir a Blob";
    return response.status(500).json({ error: blobHelp(message) });
  }
}

  const filename =
    typeof request.body?.filename === "string" ? request.body.filename : "";
  const contentType =
    typeof request.body?.contentType === "string"
      ? request.body.contentType
      : "application/octet-stream";
  const data = typeof request.body?.data === "string" ? request.body.data : "";

  if (!filename || !data) {
    return response.status(400).json({ error: "Archivo incompleto" });
  }

  try {
    const buffer = Buffer.from(data, "base64");
    const blob = await put(`jdj/${Date.now()}-${filename}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return response.status(200).json({ url: blob.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir a Blob";
    return response.status(500).json({ error: message });
  }
}
