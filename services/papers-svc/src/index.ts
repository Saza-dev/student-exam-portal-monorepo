import { Hono } from "hono";
import paperRoutes from "./routes/papers";
import type { Env } from "./types/env";

// Initialize Hono with the correct Bindings for the Papers service
const app = new Hono<{ Bindings: Env }>();

// Group all paper-related logic under the /papers prefix
app.route("/papers", paperRoutes);

// Export the Worker's default fetch handler
export default app;
