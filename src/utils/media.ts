import { AUTH_SECRET_KEY } from "../data/defaultContent";

export async function uploadMedia(file: File) {
  const password = sessionStorage.getItem(AUTH_SECRET_KEY) || "";
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(`jdj/${Date.now()}-${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob",
    clientPayload: password,
  });
  return blob.url;
}
