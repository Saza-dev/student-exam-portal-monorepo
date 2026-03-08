/**
 * @vitest-environment happy-dom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, expect, it } from "vitest";
import api from "../lib/axios";
import LoginPage from "../app/(auth)/login/page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../lib/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

it("should login successfully and redirect to dashboard", async () => {
  // 🚨 FIX 1: Structure the mock to match your component's 'data.data' logic
  (api.post as any).mockResolvedValue({
    data: {
      data: {
        user: { id: "123", email: "student@example.com" },
        access_token: "mock-access",
        refresh_token: "mock-refresh",
      },
    },
  });

  const { container } = render(<LoginPage />);

  // 🚨 FIX 2: Use "student@example.com" to match the actual placeholder in LoginPage.tsx
  fireEvent.change(screen.getByPlaceholderText("student@example.com"), {
    target: { value: "student@example.com" },
  });

  // 🚨 FIX 3: Use a password that passes your Zod regex (Uppercase + Number + 8 chars)
  fireEvent.change(screen.getByPlaceholderText("********"), {
    target: { value: "SecurePass123" },
  });

  // Trigger Submit
  const form = container.querySelector("form");
  if (form) fireEvent.submit(form);

  // 4. Final Assertions
  await waitFor(
    () => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "student@example.com",
        password: "SecurePass123",
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    },
    { timeout: 3000 },
  );
});
