import { Hono } from "hono";
import { HonoEnv } from "./types/hono";
import authRoutes from "./routes/auth";

const app = new Hono<HonoEnv>();

app.route("/auth", authRoutes);

export default app;
