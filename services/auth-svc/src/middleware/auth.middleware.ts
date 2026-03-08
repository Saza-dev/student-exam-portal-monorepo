import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { HonoEnv } from "../types/hono"; // Import the new shared type

export const jwtAuth = async (c: Context<HonoEnv>, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");

    // TypeScript now knows "user" is a valid key because of HonoEnv
    c.set("user", {
      user_id: String(payload.sub),
      email: String(payload.email),
      role: String(payload.role),
    });

    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
};
