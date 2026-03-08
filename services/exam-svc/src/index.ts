import { Hono } from "hono";
import examRoutes from "./routes/exam";
import type { Env } from "./types/env";

// Initialize Hono with the correct Bindings (including KV for timers)
const app = new Hono<{ Bindings: Env }>();

// Group all exam/session logic under the /exam prefix
app.route("/exam", examRoutes);

// Export the Worker's default fetch handler
export default app;
