import { STOREFRONT_ROOT_DOMAIN } from "../store-domain";

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

const LOCAL_WEB_URL = "http://localhost:3000";
const LOCAL_DASHBOARD_URL = "http://localhost:3001";
const PRODUCTION_WEB_URL = `https://www.${STOREFRONT_ROOT_DOMAIN}`;
const PRODUCTION_DASHBOARD_URL = `https://dashboard.${STOREFRONT_ROOT_DOMAIN}`;

function useProductionOrigins(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "development") return false;
  if (vercelEnv === "production" || vercelEnv === "preview") return true;
  return process.env.NODE_ENV === "production";
}

function isLocalhostOrigin(value: string): boolean {
  try {
    const url = value.includes("://") ? new URL(value) : new URL(`https://${value}`);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value);
  }
}

function publicOrigin(raw: string | undefined, productionFallback: string, localFallback: string): string {
  const configured = (raw ?? "").trim().replace(/\/$/, "");
  const production = useProductionOrigins();
  if (!configured || (production && isLocalhostOrigin(configured))) {
    return production ? productionFallback : localFallback;
  }
  if (configured.startsWith("http://") || configured.startsWith("https://")) return configured;
  return `https://${configured}`;
}

/** Marketing / storefront origin (no trailing slash). */
export function getWebUrl(): string {
  return publicOrigin(process.env.NEXT_PUBLIC_WEB_URL, PRODUCTION_WEB_URL, LOCAL_WEB_URL);
}

/** Seller dashboard origin (no trailing slash). */
export function getDashboardUrl(): string {
  return publicOrigin(
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    PRODUCTION_DASHBOARD_URL,
    LOCAL_DASHBOARD_URL
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
