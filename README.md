# JDJ Jayaque 2026

Landing de la Jornada Diocesana de la Juventud — Arquidiócesis de San Salvador.

## Stack

- React + TypeScript + Vite
- Deploy en Vercel
- Archivos (logo, PDFs) en **Vercel Blob** desde `/admin`

## Admin en Vercel (subir logo y documentos)

No hace falta pasar por GitHub cada vez. El panel `/admin` sube a Blob y el sitio lee esas URLs.

1. En Vercel: **Storage → Create Database → Blob**
2. Conecta el Blob al proyecto (crea `BLOB_READ_WRITE_TOKEN`)
3. Variables de entorno:
   - `ADMIN_PASSWORD` (la del panel; no uses el prefijo `VITE_` para esta)
   - `VITE_ADMIN_PASSWORD` igual, para el login en el navegador
4. Redeploy
5. Entra a `https://tu-dominio.vercel.app/admin`, sube el logo o los PDFs y pulsa **Guardar cambios**

En local, sin Blob, puedes seguir usando archivos en `public/images` y `public/docs`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy

GitHub → Vercel (preset Vite). Rutas: `/`, `/catequesis`, `/admin`.
