import { NextRequest, NextResponse } from "next/server";

// Public paths that don't require auth.
// "/" must match exactly — a prefix match on "/" would make every route public.
const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIXES = ["/login", "/api/auth", "/privacy", "/terms"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, Next internals and static files through
  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check for session token (next-auth sets this cookie)
  const sessionToken =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
