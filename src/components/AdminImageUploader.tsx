import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { uploadMedia } from "../utils/media";
import "./AdminImageUploader.css";

type AdminImageUploaderProps = {
  onUpload: (urls: string[]) => void;
  allowUploads?: boolean;
  folder?: "images" | "docs";
  multiple?: boolean;
  buttonText?: string;
  hint?: string;
  sequential?: boolean;
  maxFiles?: number;
};

type UploadProgress = {
  active: boolean;
  current: number;
  total: number;
  percent: number;
  fileName: string;
  statusText: string;
};

const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/tiff",
  "image/svg+xml",
  "image/*",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
  ".heif",
  ".avif",
  ".tiff",
  ".svg",
].join(",");

export function AdminImageUploader({
  onUpload,
  allowUploads = true,
  folder = "images",
  multiple = true,
  buttonText = "Agregar fotos",
  hint = "Acepta JPG, JPEG, PNG, WEBP, GIF, HEIC, AVIF, TIFF, etc. Compresión automática a WebP.",
  sequential = false,
  maxFiles,
}: AdminImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    active: false,
    current: 0,
    total: 0,
    percent: 0,
    fileName: "",
    statusText: "",
  });
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFiles(rawFiles: File[]) {
    if (!rawFiles.length) return;

    if (!allowUploads) {
      setNotice({
        type: "error",
        text: "En producción no se suben fotos. Abre el sitio local con npm run dev para subir y comprimir fotos.",
      });
      return;
    }

    const files = typeof maxFiles === "number" && maxFiles > 0 ? rawFiles.slice(0, maxFiles) : rawFiles;
    if (!files.length) {
      setNotice({
        type: "error",
        text: "Se ha alcanzado el límite máximo de fotos para esta sección.",
      });
      return;
    }

    setNotice(null);
    const total = files.length;
    const uploadedUrls: string[] = [];

    setProgress({
      active: true,
      current: 0,
      total,
      percent: 5,
      fileName: files[0].name,
      statusText: `Preparando ${total} archivo(s)...`,
    });

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        const startPercent = Math.round((i / total) * 100);
        
        setProgress({
          active: true,
          current: i + 1,
          total,
          percent: Math.max(10, startPercent),
          fileName: file.name,
          statusText: `Subiendo y comprimiendo (${i + 1}/${total}): ${file.name}...`,
        });

        try {
          const res = await uploadMedia(file, folder, { sequential });
          if (res?.url) {
            uploadedUrls.push(res.url);
          }
        } catch (err) {
          console.warn(`Error al subir ${file.name}:`, err);
        }

        const endPercent = Math.round(((i + 1) / total) * 100);
        setProgress((prev) => ({
          ...prev,
          percent: endPercent,
          statusText: `Procesado (${i + 1}/${total}): ${file.name}`,
        }));
      }

      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls);
        setNotice({
          type: "success",
          text: `✔ ${uploadedUrls.length} foto(s) subida(s) y comprimida(s) correctamente.`,
        });
      } else {
        setNotice({
          type: "error",
          text: "No se pudo procesar ninguna foto.",
        });
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Fallo durante la subida de archivos.",
      });
    } finally {
      setTimeout(() => {
        setProgress((prev) => ({ ...prev, active: false }));
      }, 1500);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (selected && selected.length) {
      void processFiles(Array.from(selected));
    }
    e.target.value = "";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length) {
      const validFiles = Array.from(droppedFiles).filter((f) =>
        f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif|avif|tiff|svg)$/i.test(f.name)
      );
      if (validFiles.length) {
        void processFiles(validFiles);
      } else {
        setNotice({
          type: "error",
          text: "Selecciona únicamente archivos de imagen (JPG, PNG, WEBP, etc.).",
        });
      }
    }
  }

  return (
    <div className="admin-uploader">
      <div
        className={`admin-uploader__dropzone ${isDragging ? "is-dragging" : ""} ${
          progress.active ? "is-busy" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !progress.active && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple={multiple}
          disabled={progress.active}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <div className="admin-uploader__content">
          <div className="admin-uploader__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="admin-uploader__text">
            <strong>{buttonText}</strong>
            <span>Arrastra fotos aquí o haz clic para seleccionar</span>
            <small>{hint}</small>
          </div>
        </div>
      </div>

      {progress.active && (
        <div className="admin-uploader__progress">
          <div className="admin-uploader__progress-header">
            <span className="admin-uploader__filename">{progress.statusText}</span>
            <span className="admin-uploader__percent">{progress.percent}%</span>
          </div>
          <div className="admin-uploader__track">
            <div
              className="admin-uploader__bar"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="admin-uploader__subtext">
            ⚡ Comprimiendo y generando formato optimizado WebP en servidor local...
          </div>
        </div>
      )}

      {notice && (
        <div className={`admin-uploader__notice is-${notice.type}`}>
          {notice.text}
        </div>
      )}
    </div>
  );
}
