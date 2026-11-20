import { getCloudflareContext } from "@opennextjs/cloudflare";

/* Minimal shapes of the Cloudflare bindings this feature uses. */
export interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: { changes: number };
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}
export interface AlphaDatabase {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result<unknown>[]>;
}
export interface BuildObject {
  size: number;
  httpEtag: string;
  uploaded: Date;
  range?: { offset?: number; length?: number; suffix?: number };
  body: ReadableStream;
}
export interface BuildBucket {
  get(key: string, options?: { range?: Headers }): Promise<BuildObject | null>;
  head(key: string): Promise<Omit<BuildObject, "body" | "range"> | null>;
}

declare global {
  interface CloudflareEnv {
    ALPHA_DB?: AlphaDatabase;
    ALPHA_BUILDS?: BuildBucket;
    ALPHA_CAP?: string;
    ALPHA_EMAIL_FROM?: string;
    ALPHA_SITE_URL?: string;
    ALPHA_BUILD_ANDROID?: string;
    ALPHA_BUILD_WINDOWS?: string;
    ALPHA_LINK_HOURS?: string;
    TURNSTILE_SITE_KEY?: string;
    /* Secrets, set with `npx wrangler secret put <NAME>`. */
    TURNSTILE_SECRET_KEY?: string;
    RESEND_API_KEY?: string;
    ALPHA_SIGNING_SECRET?: string;
    ALPHA_ADMIN_TOKEN?: string;
  }
}

export type Platform = "android" | "windows";
export const PLATFORMS: Record<Platform, { label: string; size: string }> = {
  android: { label: "Android (APK)", size: "156 MB" },
  windows: { label: "Windows PC", size: "193 MB" },
};

export function alphaEnv() {
  const env = getCloudflareContext().env;
  if (!env.ALPHA_DB) throw new Error("ALPHA_DB binding is missing");
  return {
    env,
    db: env.ALPHA_DB,
    cap: Math.max(0, Number.parseInt(env.ALPHA_CAP ?? "100", 10) || 100),
    linkHours: Math.min(24, Math.max(1, Number(env.ALPHA_LINK_HOURS ?? "6") || 6)),
    siteUrl: (env.ALPHA_SITE_URL ?? "https://www.kenyalangku.my").replace(/\/$/, ""),
    buildKey: (platform: Platform) =>
      platform === "android"
        ? env.ALPHA_BUILD_ANDROID ?? "GenesisRoulette-0.2.1-tester.apk"
        : env.ALPHA_BUILD_WINDOWS ?? "GenesisRoulette-0.2.1-win64.zip",
  };
}
