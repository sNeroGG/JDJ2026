/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMING_SOON?: string;
  readonly VITE_REVEAL_AT?: string;
  readonly VITE_VERCEL_ENV?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_CF_BEACON_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
