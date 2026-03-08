import type { KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  DATABASE_URL: string; // Neon URL
  KV: KVNamespace; // Cloudflare KV for session timers
  JWT_SECRET: string;
}
