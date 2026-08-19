# JDJ Jayaque 2026

Landing de la Jornada Diocesana de la Juventud — Arquidiócesis de San Salvador.

## Stack

- React + TypeScript + Vite
- Deploy en Vercel
- Archivos (logo, PDFs) en **Vercel Blob** desde `/admin`

## Admin en Vercel (subir logo y documentos)

No hace falta pasar por GitHub cada vez. El panel `/admin` sube a Blob y el sitio lee esas URLs.

1. En Vercel: **Storage → Create Database → Blob**
2. Abre el store → **Connect Project** y elige este sitio
3. Variables:
   - `ADMIN_PASSWORD`
   - `VITE_ADMIN_PASSWORD` (la misma)
4. **Redeploy** (Deployments → ⋮ → Redeploy)
5. En `/admin` cierra sesión, entra otra vez, sube el archivo y **Guardar cambios**

En local, sin Blob, puedes seguir usando archivos en `public/images` y `public/docs`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy

GitHub → Vercel (preset Vite). Rutas: `/`, `/catequesis`, `/admin`.
