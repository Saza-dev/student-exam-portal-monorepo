import type { KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  DATABASE_URL: string; // Neon URL
  JWT_SECRET: string; // Secret key for verifying JWTs
  KV: KVNamespace; // Cloudflare KV binding for rate limiting
}
