/**
 * src/server/mcp-auth.ts
 *
 * Authentication and JWT token issuance for Campus Career Pilot MCP Server.
 *
 * Provides:
 * - Judges demo token minting (14-day validity, scoped to mcp:read mcp:write)
 * - User seeding for demo-judge@careerpilot.internal
 * - Bearer token verification with typed payload extraction
 */

import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const DEMO_JUDGE_EMAIL = "demo-judge@careerpilot.internal";
export const MCP_DEFAULT_SCOPE = "mcp:read mcp:write";

/**
 * Derives the symmetric signing key for MCP tokens from environment.
 * Prefers MCP_SECRET, falls back to NEXTAUTH_SECRET, or a deterministic fallback.
 */
export function getMcpSecretKey(): Uint8Array {
  const secret =
    process.env.MCP_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "careerpilot-mcp-demo-secret-key-minimum-32-chars-long";
  return new TextEncoder().encode(secret);
}

export interface McpTokenPayload {
  userId: string;
  email: string;
  scope: string;
}

/**
 * Mints or seeds a 60-day bearer token for demo-judge@careerpilot.internal.
 */
export async function mintDemoJudgeToken(expirationDays = 60): Promise<{
  token: string;
  userId: string;
  email: string;
  expiresIn: string;
}> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_JUDGE_EMAIL },
    update: {},
    create: {
      email: DEMO_JUDGE_EMAIL,
      name: "Demo Judge",
    },
  });

  const expiresIn = `${expirationDays}d`;
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    scope: MCP_DEFAULT_SCOPE,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getMcpSecretKey());

  return {
    token,
    userId: user.id,
    email: user.email || DEMO_JUDGE_EMAIL,
    expiresIn,
  };
}

/**
 * Verifies a bearer JWT token string and extracts user claims.
 */
export async function verifyMcpToken(token: string): Promise<McpTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getMcpSecretKey());
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }
    return {
      userId: payload.sub,
      email: (payload.email as string) || "",
      scope: (payload.scope as string) || "",
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and authenticates Bearer token from incoming Request headers.
 */
export async function authenticateMcpRequest(
  req: Request
): Promise<McpTokenPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1].trim();
  return verifyMcpToken(token);
}
