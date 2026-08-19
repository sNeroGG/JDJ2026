function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "jdj2026";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password !== adminPassword()) {
    return Response.json({ ok: false }, { status: 401 });
  }
  return Response.json({ ok: true });
}
