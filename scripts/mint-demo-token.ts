#!/usr/bin/env tsx
/**
 * scripts/mint-demo-token.ts
 *
 * Mints a 60-day scoped Bearer JWT token for Hackathon judges:
 * - Target User: demo-judge@careerpilot.internal (auto-seeded if missing)
 * - Scope: mcp:read mcp:write
 * - Expiration: 60 days
 *
 * Usage:
 *   npx tsx scripts/mint-demo-token.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

async function main() {
  // Dynamic import ensures process.env is populated from .env.local before prisma loads
  const { mintDemoJudgeToken, DEMO_JUDGE_EMAIL, MCP_DEFAULT_SCOPE } = await import(
    "../src/server/mcp-auth"
  );

  console.log("================================================================================");
  console.log(" Campus Career Copilot — Judge Bearer Token Generator (MCP Endpoint)");
  console.log("================================================================================");

  try {
    const { token, userId, email, expiresIn } = await mintDemoJudgeToken(60);

    console.log(`\n[✓] Successfully provisioned judge identity and minted access token:`);
    console.log(`    User ID:    ${userId}`);
    console.log(`    Email:      ${email}`);
    console.log(`    Scope:      ${MCP_DEFAULT_SCOPE}`);
    console.log(`    Validity:   ${expiresIn} (60 days)`);

    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`BEARER TOKEN (Copy below for Devpost judging / MCP clients):`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(token);
    console.log(`--------------------------------------------------------------------------------`);

    console.log(`\n================================================================================`);
    console.log(`CURL USAGE EXAMPLES:`);
    console.log(`================================================================================`);

    console.log(`\n1. Handshake / Initialize (Protocol: 2025-11-25):`);
    console.log(`curl -X POST http://localhost:3000/api/mcp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Accept: application/json, text/event-stream" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"judge-terminal","version":"1.0.0"}}}'`);

    console.log(`\n2. List All 8 Registered Tools:`);
    console.log(`curl -X POST http://localhost:3000/api/mcp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Accept: application/json, text/event-stream" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "mcp-protocol-version: 2025-11-25" \\`);
    console.log(`  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'`);

    console.log(`\n3. Call Tool (e.g. dsa_next):`);
    console.log(`curl -X POST http://localhost:3000/api/mcp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Accept: application/json, text/event-stream" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "mcp-protocol-version: 2025-11-25" \\`);
    console.log(`  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"dsa_next","arguments":{}}}'`);

    console.log(`\n4. Verify 401 Unauthorized (Without Token):`);
    console.log(`curl -i -X POST http://localhost:3000/api/mcp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Accept: application/json, text/event-stream" \\`);
    console.log(`  -d '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}'`);

    console.log(`\n================================================================================`);
    console.log(`MCP CLIENT CONFIG (e.g. Claude Desktop / Open-WebUI):`);
    console.log(`================================================================================`);
    const clientConfig = {
      mcpServers: {
        "campus-career-pilot": {
          url: "http://localhost:3000/api/mcp",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    };
    console.log(JSON.stringify(clientConfig, null, 2));
    console.log("================================================================================\n");
  } catch (err) {
    console.error("[!] Failed to mint demo token:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
