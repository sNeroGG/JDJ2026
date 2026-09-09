# Continuidad JDJ 2026

Notas para retomar el sitio después del 7 de septiembre de 2026. El README
tiene el stack y el día a día; esto es **dónde nos quedamos** y **qué sigue**.

## Estado al cortar

- Rama: `main`, alineada con GitHub tras el merge de esta PC + la otra
  (`Fix: Produccion status`, camisa misteriosa, sede/inicio).
- El público ve **Próximamente**: logo chico arriba, contador rojo al centro
  (brillo tipo respiración), texto
  *Jornada Diocesana de la Juventud* / *Arquidiócesis de San Salvador*.
- El **12 de septiembre de 2026 a las 08:00** (hora de El Salvador) el
  contador llega a cero y **se abre sola** la landing completa. No hay que
  entrar a `/equipo` ni redeploy a esa hora.
- En el código, la fecha está en `src/utils/comingSoon.ts`
  (`DEFAULT_REVEAL_AT`) y se puede cambiar con `VITE_REVEAL_AT` en Vercel.

## Tres puertas

| Quién | URL | Variable | Qué ve |
| --- | --- | --- | --- |
| Público | `/` | — | Solo Próximamente hasta el revelado |
| Equipo | `/equipo` | `TEAM_PASSWORD` | Landing completa + aviso interno |
| Admin | `/jdj-cms` | `ADMIN_PASSWORD` | Panel. También desbloquea la landing |

- `/admin` redirige al inicio a propósito.
- La clave del equipo **no** abre el CMS ni deja publicar.
- En local: panel `jdj2026`, equipo `equipo2026`.
- En Vercel esas claves por defecto **no valen**. Hay que definir
  `ADMIN_PASSWORD` y `TEAM_PASSWORD` (sin prefijo `VITE_`).
- En la vista interna, **Ver para público** muestra la cortina. **Volver a
  vista interna** solo aparece si activaste esa vista.

## Variables que importan ahora

En Vercel → Settings → Environment Variables (Production):

- `ADMIN_PASSWORD` — ya debía existir
- `TEAM_PASSWORD` — **ponerla** si aún no está; si no, `/equipo` no entra
- `VITE_REVEAL_AT` — opcional; si falta, usa `2026-09-12T08:00`
- `VITE_COMING_SOON=false` — solo si quieren abrir el sitio **antes** del
  contador (luego redeploy)
- `VITE_SITE_URL` — dominio canónico cuando esté
- `GITHUB_TOKEN` — para publicar textos desde `/jdj-cms`
- `VITE_CF_BEACON_TOKEN` — analíticas largas (ver abajo)
- Donaciones y tienda: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
  (correr `supabase/schema.sql` en el SQL Editor). Sin esto, los pedidos en
  Vercel se pueden perder y `/donar` no guarda.

Tras cambiar cualquier `VITE_*`, hay que **Redeploy**.

## Analíticas (no perder días)

1. **Vercel Analytics (Hobby)** — ya se dio Enable. Guarda **30 días**. El
   día 1 de octubre y el 1 de noviembre: Analytics → tres puntos del gráfico
   → Export as CSV.
2. **Cloudflare Web Analytics** — aún falta el token. Es un producto
   distinto de «Add a site» de DNS.
   - **No** agregar `*.vercel.app` como zona DNS ni nubes naranjas Proxied
     (rompe Vercel).
   - Ir a **Web Analytics → Add a site**, hostname
     `jdj-ss-2026.vercel.app` (o el dominio final), copiar el token,
     pegarlo en `VITE_CF_BEACON_TOKEN`, redeploy.
3. Edad, vicaría, parroquia **no** salen de Vercel/Cloudflare. Van cuando
   exista registro propio (Supabase + pestaña en `/jdj-cms`).

## Qué ya está (no rehacer)

- Cortina de Próximamente y revelado automático
- `/equipo` con PIN en servidor (`api/team-login.ts`)
- Merge con la otra PC: tienda (mystery shirt), Hero, sede/inicio,
  catequesis, admin, `savedContent`
- Donaciones por transferencia + WhatsApp. Pedidos y donaciones en Supabase
  cuando las vars y `schema.sql` están (si no, pedidos frágiles en Vercel).

## Qué sigue (prioridad)

1. Confirmar en Vercel `TEAM_PASSWORD` y que Production tenga este `main`.
2. Probar en el dominio publicado: `/` (cortina), `/equipo`, `/jdj-cms`.
3. Terminar Cloudflare Web Analytics (beacon, no DNS).
4. Cuando abran inscripción: formulario (edad por rangos, vicaría,
   parroquia) en Supabase y tab Estadísticas en el panel. Tráfico = Vercel
   + Cloudflare; personas = registro propio. No armar un contador de visitas
   aparte.
5. Apagar la cortina a mano solo si hace falta antes del 12:
   `VITE_COMING_SOON=false`.

## Cómo seguir en Cursor

```bash
npm install
npm run dev
```

- Cortina: `http://localhost:5173/`
- Equipo: `http://localhost:5173/equipo`
- Panel: `http://localhost:5173/jdj-cms`

Archivos de la cortina: `src/pages/ComingSoonPage.tsx` +
`ComingSoonPage.css`. El contador de la landing original
(`src/components/Countdown.css` + Hero) **no** se toca con esos estilos.

Si `git pull` abre Vim en el merge: salir con `:q` o `Q` y cerrar el merge
con `git commit -m "Merge branch 'main'"`. Hay un `.swp` viejo de
`MERGE_MSG` que ya se borró una vez; si vuelve, borrar
`.git/.MERGE_MSG.swp`.

## Copy

En todo el sitio: **Arquidiócesis**, **Diócesis**, **Diocesana/o**,
**Arquidiocesana/o**, siempre con mayúscula y tilde, también a mitad de
frase.
