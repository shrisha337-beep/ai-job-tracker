import { describe, it, expect, vi } from "vitest";

// Avoid touching a real database when importing the auth config.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));

const { authOptions } = await import("@/lib/auth");

describe("authOptions", () => {
  it("only allows Google OAuth (no email-only Credentials login)", () => {
    const ids = authOptions.providers.map((p) => p.id);
    expect(ids).toEqual(["google"]);
    expect(authOptions.providers.some((p) => p.type === "credentials")).toBe(false);
  });

  it("uses JWT sessions and the custom /login page", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.pages?.signIn).toBe("/login");
  });
});
