export interface Env {
  DATABASE_URL: string; // Neon URL
  KV: KVNamespace; // Cloudflare KV binding for refresh tokens
  JWT_SECRET: string; // Secret key for signing JWTs
}

export type HonoConfig = {
  Bindings: Env;
  Variables: {
    requestId: string;
  };
};
