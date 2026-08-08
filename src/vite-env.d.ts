/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VELOURA_QUEST_URL?: string;
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
