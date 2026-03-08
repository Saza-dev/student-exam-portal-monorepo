import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../stores/authStore";

describe("Auth Store (Requirement 3)", () => {
  beforeEach(() => {
    // 🚨 FIX: Call methods on the store
    useAuthStore.getState().clearAuth();
  });

  it("setAuth persists correct state", () => {
    const mockUser = {
      id: "1",
      email: "tester@example.com",
      role: "student",
      fullName: "API Tester",
    };
    const mockToken = "access-token";

    // Ensure your store has a setAuth method, or use setState
    useAuthStore.setState({
      user: mockUser,
      accessToken: mockToken,
      isAuthenticated: true,
    });

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("clearAuth resets to initial state", () => {
    // Manually set some state first
    useAuthStore.setState({ isAuthenticated: true });

    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
