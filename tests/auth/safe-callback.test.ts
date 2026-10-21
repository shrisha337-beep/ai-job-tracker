import { describe, it, expect } from "vitest";
import { getSafeCallbackUrl } from "@/lib/safe-callback";

describe("getSafeCallbackUrl", () => {
  it("allows safe relative paths", () => {
    expect(getSafeCallbackUrl("/resume")).toBe("/resume");
    expect(getSafeCallbackUrl("/applications")).toBe("/applications");
    expect(getSafeCallbackUrl("/dashboard?tab=overview")).toBe("/dashboard?tab=overview");
  });

  it("falls back to /dashboard on null, undefined, or empty string", () => {
    expect(getSafeCallbackUrl(null)).toBe("/dashboard");
    expect(getSafeCallbackUrl("")).toBe("/dashboard");
  });

  it("blocks protocol-relative open-redirect URLs", () => {
    expect(getSafeCallbackUrl("//evil.com")).toBe("/dashboard");
    expect(getSafeCallbackUrl("//attacker.org/phish")).toBe("/dashboard");
  });

  it("blocks backslash open-redirect variants", () => {
    expect(getSafeCallbackUrl("/\\evil.com")).toBe("/dashboard");
  });

  it("blocks absolute external URLs", () => {
    expect(getSafeCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(getSafeCallbackUrl("http://evil.com")).toBe("/dashboard");
    expect(getSafeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
  });

  it("respects custom fallback when provided", () => {
    expect(getSafeCallbackUrl("//evil.com", "/login")).toBe("/login");
  });
});
