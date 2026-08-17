# JDJ Jayaque 2026

Landing page de bienvenida de la Jornada Diocesana de la Juventud — Arquidiócesis de San Salvador.

## Stack

- React + TypeScript
- Vite
- Deploy pensado para Vercel

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Subir a GitHub y Vercel

### 1. Crear el repo en GitHub

Crea un repositorio vacío (sin README ni `.gitignore` si este proyecto ya los tiene).

### 2. Conectar y subir

Desde esta carpeta:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### 3. Deploy en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa el repo de GitHub
3. Vercel debería detectar **Vite** automáticamente
4. Confirma:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Deploy

También puedes usar la CLI:

```bash
npm i -g vercel
vercel
```

## Admin

Panel en `/admin`.

Contraseña por defecto: `jdj2026`  
Cámbiala con `VITE_ADMIN_PASSWORD` (local: `.env` / Vercel: Environment Variables).

### Qué puedes editar
1. **Variables rápidas** — nombre, año, lema, sede, botón, SEO
2. **Logo PNG** — arrastra o selecciona el archivo del logo principal
3. Hero, sede, significado, evento
4. Logos institucionales
5. Footer, menú y redes

Pulsa **Guardar cambios** (o **Guardar logo**) para aplicar. Los cambios quedan en este navegador (`localStorage`). Usa **Exportar JSON** para respaldo.
