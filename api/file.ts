import { get } from "@vercel/blob";

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("pathname") || "";
  if (!pathname.startsWith("jdj")) {
    return Response.json({ error: "Ruta no válida" }, { status: 400 });
  }

  const result = await get(pathname, { access: "private" });
  if (result.statusCode !== 200 || !result.stream) {
    return new Response("No encontrado", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
