import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "jdj2026";
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).end();
  }

  try {
    const json = await handleUpload({
      body: request.body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (clientPayload !== adminPassword()) {
          throw new Error("No autorizado");
        }
        return {
          allowedContentTypes: [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return response.status(200).json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir";
    return response.status(400).json({ error: message });
  }
}
