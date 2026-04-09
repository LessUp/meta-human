/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly SSR: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare const __MOBILE__: boolean;
declare const __DESKTOP__: boolean;
declare const __AR__: boolean;
declare const __APP_VERSION__: string;
