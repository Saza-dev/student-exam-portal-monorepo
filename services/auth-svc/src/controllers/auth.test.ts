import { describe, it, expect, vi } from "vitest";
import { registerUser } from "./auth.controller";
import { drizzle } from "drizzle-orm/neon-http";

vi.mock("drizzle-orm/neon-http", () => ({ drizzle: vi.fn() }));

describe("Auth Service (Requirement 1)", () => {
  it("returns 201 with user_id on valid registration", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "uuid-123" }]),
        }),
      }),
    };
    (drizzle as any).mockReturnValue(mockDb);

    const mockCtx = {
      req: {
        json: async () => ({
          email: "t@t.com",
          password: "123",
          full_name: "Test",
        }),
      },
      env: { DATABASE_URL: "url" },
      json: vi.fn().mockImplementation((body, status) => ({
        status,
        json: async () => body,
      })),
    } as any;

    const res = await registerUser(mockCtx);
    expect(res.status).toBe(201);
    const body = await res.json() as any
    expect(body.data).toHaveProperty("id", "uuid-123");
  });
});
