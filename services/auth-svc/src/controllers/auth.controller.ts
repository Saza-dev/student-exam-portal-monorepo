import { Context } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { users } from "@assessment/db";
import { createErrorResponse } from "@assessment/middleware";
import { Env } from "../types/env";

// register
export const registerUser = async (c: Context<{ Bindings: Env }>) => {
  const body = await c.req.json();
  const { email, password, full_name } = body;

  const passwordHash = await bcrypt.hash(password, 12);
  const db = drizzle(c.env.DATABASE_URL);

  try {
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName: full_name,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      });

    return c.json(
      {
        data: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.fullName,
        },
      },
      201,
    );
  } catch (error: any) {
    if (error.code === "23505") {
      return c.json(
        createErrorResponse(
          409,
          "Email already registered",
          c.req.header("X-Request-ID"),
        ),
        409,
      );
    }
    return c.json(
      createErrorResponse(
        500,
        "Internal server error",
        c.req.header("X-Request-ID"),
      ),
      500,
    );
  }
};

// login
export const loginUser = async (c: Context<{ Bindings: Env }>) => {
  const { email, password } = await c.req.json();

  const db = drizzle(c.env.DATABASE_URL);

  // 1. Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.json(
      createErrorResponse(
        401,
        "Invalid credentials",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  // 2. Verify password (Requirement 2)
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return c.json(
      createErrorResponse(
        401,
        "Invalid credentials",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  // 3. Generate Access Token (15 min) (Requirement 2)
  const payload = {
    sub: user.id,
    email: user.email,
    role: "student", // Default role for this assessment
    exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
  };
  const accessToken = await sign(payload, c.env.JWT_SECRET, "HS256");

  // 4. Generate Refresh Token (Requirement 2)
  const refreshToken = crypto.randomUUID();

  // 5. Store Refresh Token in KV with 7-day TTL (Requirement 2)
  // Value can be the user ID so we know who the token belongs to
  await c.env.KV.put(refreshToken, user.id, {
    expirationTtl: 60 * 60 * 24 * 7, // 7 days in seconds
  });

  // 6. Return response (Requirement 2)
  return c.json(
    {
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          role: "student",
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 60 * 15, // 15 minutes in seconds
      },
    },
    200,
  );
};

// refresh token
export const refreshTokens = async (c: Context<{ Bindings: Env }>) => {
  // 1. Read refresh token from the request body
  const { refresh_token: oldRefreshToken } = await c.req.json();

  if (!oldRefreshToken) {
    return c.json(
      createErrorResponse(
        401,
        "Refresh token required",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  // 2. Look up the token in Cloudflare KV
  const userId = await c.env.KV.get(oldRefreshToken);

  if (!userId) {
    return c.json(
      createErrorResponse(
        401,
        "Invalid or expired refresh token",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  // 3. Rotate the token: Delete the old one
  await c.env.KV.delete(oldRefreshToken);

  // 4. Fetch user details from database to include in new JWT
  const db = drizzle(c.env.DATABASE_URL);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json(
      createErrorResponse(401, "User not found", c.req.header("X-Request-ID")),
      401,
    );
  }

  // 5. Issue a new Access Token (15 min) with complete payload
  const accessTokenPayload = {
    sub: userId,
    email: user.email,
    role: "student",
    exp: Math.floor(Date.now() / 1000) + 60 * 15,
  };
  const newAccessToken = await sign(
    accessTokenPayload,
    c.env.JWT_SECRET,
    "HS256",
  );

  // 6. Issue a new Refresh Token
  const newRefreshToken = crypto.randomUUID();
  await c.env.KV.put(newRefreshToken, userId, {
    expirationTtl: 60 * 60 * 24 * 7, // 7 days
  });

  // 7. Return both new tokens
  return c.json(
    {
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: 60 * 15,
      },
    },
    200,
  );
};

// logout
export const logoutUser = async (c: Context<{ Bindings: Env }>) => {
  const { refresh_token } = await c.req.json();

  if (refresh_token) {
    // Delete the refresh token from KV
    await c.env.KV.delete(refresh_token);
  }

  // Success response
  return c.json(
    {
      data: {
        message: "Successfully logged out",
      },
    },
    200,
  );
};

// get Me
export const getMe = async (c: Context<{ Bindings: Env }>) => {
  const userId = c.req.header("X-User-Id");

  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DATABASE_URL);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
      },
    },
  });
};
