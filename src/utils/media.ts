import { AUTH_SECRET_KEY } from "../data/defaultContent";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadMedia(
  file: File,
  folder: "images" | "docs" = "images",
) {
  if (!import.meta.env.DEV) {
    throw new Error(
      "Sube archivos en local (npm run dev). Se guardan en public/images o public/docs y viajan con el deploy.",
    );
  }

  const password = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
  if (!password) {
    throw new Error("Cierra sesión en /admin y vuelve a entrar, luego sube el archivo.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("El archivo supera 15 MB. Usa uno más liviano.");
  }

  const data = await fileToBase64(file);
  const remote = await fetch("/__admin/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${password}`,
    },
    body: JSON.stringify({
      filename: file.name,
      folder,
      data,
    }),
  });

  const payload = (await remote.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;

  if (!remote.ok || !payload?.url) {
    throw new Error(payload?.error || `No se pudo guardar (${remote.status}).`);
  }
  return payload.url;
}
