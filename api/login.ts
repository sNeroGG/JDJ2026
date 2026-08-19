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

  const password =
    typeof request.body?.password === "string" ? request.body.password : "";
  if (password !== adminPassword()) {
    return response.status(401).json({ ok: false });
  }
  return response.status(200).json({ ok: true });
}
