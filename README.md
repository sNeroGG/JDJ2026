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

## Secciones de la landing

Las secciones nuevas se ocultan solas mientras no tengan contenido, y el menú deja
de enlazarlas para que no queden enlaces muertos.

| Sección | Aparece cuando |
| --- | --- |
| Cuenta regresiva | Hay fecha de inicio en **Agenda** |
| Agenda | Hay al menos un día con actividades |
| Inscripción | Hay pasos o enlace de formulario |
| Vicarías | Hay al menos una vicaría |
| Preguntas frecuentes | Hay al menos una pregunta |

El mapa de la sede se configura en **Sede**: con la dirección basta, y si agregas
latitud y longitud los botones de Google Maps y Waze llevan al punto exacto. El
mapa no se carga hasta que la persona lo pide, para no gastar datos de más.

## Cómo se ve al compartir el enlace

WhatsApp, Facebook e Instagram no ejecutan JavaScript: leen los metadatos del HTML
que genera el build. `vite.config.ts` los escribe tomando los valores de
`savedContent.ts`, así que basta editarlos en **Variables** del panel.

- Dominio: campo *Dominio del sitio* o `VITE_SITE_URL`. Si ambos quedan vacíos se
  usa el dominio de producción que Vercel expone durante el build.
- Imagen: `npm run optimize:og` regenera `public/images/og-jdj-2026.jpg` (1200×630)
  y el icono de iOS a partir del logo configurado. Córrelo cuando cambies el logo.
- `robots.txt` y `sitemap.xml` se generan en cada build.

## Desarrollo local

```bash
npm install
npm run dev
```

Contraseña del admin: `VITE_ADMIN_PASSWORD` (por defecto `jdj2026`).

## Deploy

GitHub → Vercel (preset Vite). Rutas: `/`, `/catequesis`, `/admin`.
