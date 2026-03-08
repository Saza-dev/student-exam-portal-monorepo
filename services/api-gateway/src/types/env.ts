import type { KVNamespace, Fetcher } from "@cloudflare/workers-types";

export interface Env {
  // Service Bindings - for routing requests to microservices
  AUTH_SVC: Fetcher;
  PAPERS_SVC: Fetcher;
  EXAM_SVC: Fetcher;

  // Infrastructure
  KV: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: "development" | "production";
}

/**
 * Hono Config with request ID and user context variables
 * Used for tracking requests and passing user data through the gateway
 */
export type HonoConfig = {
  Bindings: Env;
  Variables: {
    requestId: string;
    // Optional: user info if needed for gateway-level authorization
    user?: {
      user_id: string;
      email: string;
      role: string;
    };
  };
};
