import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy, isPublicPath } from "@/proxy";

const BASE = "http://localhost:3000";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, BASE), { headers });
}

/** NextResponse.next() sets this header; redirects and JSON responses don't. */
function passedThrough(res: Response) {
  return res.headers.get("x-middleware-next") === "1";
}

describe("isPublicPath", () => {
  it.each(["/", "/login", "/api/auth/signin", "/api/auth/callback/google", "/api/mcp", "/privacy", "/terms"])(
    "treats %s as public",
    (p) => expect(isPublicPath(p)).toBe(true)
  );

  it.each(["/dashboard", "/applications", "/resume", "/settings", "/api/applications", "/api/ai/parse-jd", "/loginx", "/api/authx"])(
    "treats %s as protected",
    (p) => expect(isPublicPath(p)).toBe(false)
  );
});

describe("proxy route guard (unauthenticated)", () => {
  it.each(["/dashboard", "/applications", "/resume", "/settings"])(
    "redirects %s to /login with callbackUrl",
    (p) => {
      const res = proxy(request(p));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("callbackUrl")).toBe(p);
    }
  );

  it.each(["/api/applications", "/api/resume", "/api/ai/parse-jd", "/api/ai/match-score"])(
    "returns 401 JSON for %s",
    async (p) => {
      const res = proxy(request(p));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized" });
    }
  );

  it.each(["/", "/login", "/privacy", "/terms", "/api/auth/session", "/api/mcp", "/favicon.ico", "/manifest.webmanifest"])(
    "lets public path %s through",
    (p) => expect(passedThrough(proxy(request(p)))).toBe(true)
  );
});

describe("proxy route guard (with session cookie)", () => {
  it.each([
    "next-auth.session-token=abc",
    "__Secure-next-auth.session-token=abc",
  ])("lets protected routes through with %s", (cookie) => {
    expect(passedThrough(proxy(request("/dashboard", cookie)))).toBe(true);
    expect(passedThrough(proxy(request("/api/applications", cookie)))).toBe(true);
  });
});
