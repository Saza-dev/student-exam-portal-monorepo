import { describe, it, expect, vi, beforeEach } from "vitest";
import { slidingRateLimiter } from "./rate-limiter";

describe("Rate Limiter (Requirement 5)", () => {
  let mockContext: any;
  let mockNext: any;

  beforeEach(() => {
    mockNext = vi.fn();
    mockContext = {
      req: { header: vi.fn().mockReturnValue(null) },
      env: { KV: { get: vi.fn(), put: vi.fn() } },
      json: vi
        .fn()
        .mockImplementation((body, status, headers) => ({ status, headers })),
    };
  });

  it("blocks the 61st request and returns 429", async () => {
    mockContext.env.KV.get.mockResolvedValue(new Array(60).fill(Date.now()));
    const res = await slidingRateLimiter(mockContext, mockNext);

    expect(res.status).toBe(429);
    expect(res.headers["Retry-After"]).toBe("60");
  });
});
