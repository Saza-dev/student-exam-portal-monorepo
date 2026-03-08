import { z } from "zod";

/**
 * User registration validation schema
 * Used by: backend auth-svc, frontend registration
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z.string().min(2, "Full name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * User login validation schema
 * Used by: backend auth-svc, frontend login
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
