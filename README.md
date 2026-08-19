# JDJ Jayaque 2026

Landing de la Jornada Diocesana de la Juventud — Arquidiócesis de San Salvador.

## Stack

- React + TypeScript + Vite
- Deploy en Vercel
- Imágenes y documentos en el repo (`public/images`, `public/docs`)

## Cómo agregar logo, imágenes y PDFs

Trabaja **en local**. Los archivos quedan en el proyecto y viajan con el deploy (sin Blob).

1. `npm run dev`
2. Entra a `/admin`
3. Sube el logo, documentos o logos institucionales y pulsa **Guardar cambios**
4. Revisa `public/images/`, `public/docs/` y `src/data/savedContent.ts`
5. Commit y push a GitHub → Vercel publica todo junto a la web

También puedes copiar archivos a esas carpetas y pegar la ruta en el admin, por ejemplo `/images/logo-principal.png` o `/docs/catequesis-1.pdf`.

## Desarrollo local

```bash
npm install
npm run dev
```

Contraseña del admin: `VITE_ADMIN_PASSWORD` (por defecto `jdj2026`).

## Deploy

GitHub → Vercel (preset Vite). Rutas: `/`, `/catequesis`, `/admin`.
