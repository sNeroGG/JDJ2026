# JDJ Jayaque 2026

Landing de la Jornada Diocesana de la Juventud — Arquidiócesis de San Salvador.

## Stack

- React + TypeScript + Vite
- Deploy en Vercel
- Imágenes y documentos en el repo (`public/images`, `public/docs`)

## Editar textos desde el sitio publicado

Los textos, las preguntas frecuentes y demás contenido se editan en `/jdj-cms`
**directamente en el sitio de Vercel**, sin tocar la terminal. La ruta `/admin`
no abre el panel (vuelve al inicio) para que nadie entre ahí por error. Al pulsar
**Publicar**, el sitio commitea `src/data/savedContent.ts` al repo con la API de
GitHub; Vercel detecta el push y reconstruye solo. El cambio se ve en vivo en un
par de minutos y queda en el historial de git por si hay que revertirlo.

Para habilitarlo hay que crear un **fine-grained PAT** en GitHub
(*Settings → Developer settings → Personal access tokens*) limitado a este repo
y con permiso **Contents: read and write**, y guardarlo en Vercel →
**Settings → Environment Variables** como `GITHUB_TOKEN`. Sin esa variable el
panel avisa que no puede publicar y `/jdj-cms` solo sirve para editar en local.

Ojo con los deploys: cada publicación genera uno, y el plan Hobby de Vercel tiene
tope diario. Conviene juntar los cambios y publicar una sola vez.

## Cómo agregar logo, imágenes y PDFs

Los archivos sí se suben **en local**. Quedan en el proyecto y viajan con el
deploy (sin Blob).

1. `npm run dev`
2. Entra a `/jdj-cms`
3. Sube el logo, documentos o logos institucionales y pulsa **Guardar**
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

## Medición de visitas

El sitio manda visitas a **Vercel Web Analytics** (`@vercel/analytics`, montado en
`src/App.tsx`). No usa cookies, así que no hace falta banner de consentimiento.

Falta un paso que no se puede hacer desde el código: en el panel de Vercel, entrar
a **Analytics** y pulsar **Enable** para el proyecto. Sin eso el sitio envía datos
pero el panel no los guarda.

Los datos se ven en Vercel → proyecto → **Analytics**, y aparecen desde el momento
del despliegue (no hay datos retroactivos). Las visitas al panel (`/jdj-cms`) se
descartan para no ensuciar los números.

El plan gratuito incluye 50,000 eventos al mes y un mes de historial. Los eventos
personalizados (descargas de PDF, clics en el mapa o en inscripción) requieren plan
Pro.

### Historial largo: Cloudflare Web Analytics

Como Vercel solo muestra el último mes, el sitio también puede mandar visitas a
**Cloudflare Web Analytics**, que es gratis, sin límite de tráfico, sin cookies y
guarda 6 meses de historial. Los dos conviven: Vercel para el día a día, Cloudflare
para ver la evolución completa hasta el evento.

Para activarlo:

1. Crear cuenta gratuita en Cloudflare y entrar a **Web Analytics → Add a site**.
2. Poner el dominio del sitio y copiar el token que genera.
3. En Vercel → proyecto → **Settings → Environment Variables**, agregar
   `VITE_CF_BEACON_TOKEN` con ese token, y volver a desplegar.

El token no es secreto (viaja en el HTML público). Si la variable está vacía, el
script no se inyecta y no cambia nada. El conteo de rutas del SPA viene activado por
defecto en el beacon; los cambios de ruta se ven en **Page Views**, no en **Visits**.

Un detalle a tener en cuenta: Cloudflare guarda los datos sin muestrear solo 7 días
y después los agrega a cerca del 10% del volumen, así que los números de meses
anteriores son estimaciones, no conteos exactos.

## Desarrollo local

```bash
npm install
npm run dev
```

Contraseña del panel: `ADMIN_PASSWORD` (en local, por defecto `jdj2026`). Se
valida en el servidor, así que **no** lleva prefijo `VITE_` y no queda expuesta
en el JavaScript del navegador. En Vercel hay que definir una clave propia: la
contraseña por defecto no se acepta en producción. La URL del panel es
`/jdj-cms`; `/admin` redirige al inicio.

Si tu proyecto todavía tiene `VITE_ADMIN_PASSWORD` en Vercel, sigue funcionando
como respaldo, pero conviene renombrarla y borrar la vieja.

## Deploy

GitHub → Vercel (preset Vite). Rutas públicas: `/`, `/catequesis`, `/tienda`,
`/donar`. Panel: `/jdj-cms`.
