#!/usr/bin/env tsx
/**
 * scripts/mcp-smoke.ts
 *
 * Smoke test for Campus Career Pilot MCP Server over Streamable HTTP:
 * 1. Verifies 401 Unauthorized is returned when no Authorization token is passed.
 * 2. Authenticates using a judge Bearer token.
 * 3. Connects via @modelcontextprotocol/sdk StreamableHTTPClientTransport.
 * 4. Prints and validates the negotiated protocol version (spec 2025-11-25 or later).
 * 5. Calls tools/list to verify all 8 registered tools are exposed.
 * 6. Executes tools/call on dsa_next and verifies valid structured output.
 *
 * Usage:
 *   npx tsx scripts/mcp-smoke.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

import http from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_SERVER_URL = process.env.MCP_URL || process.env.MCP_SERVER_URL || "http://localhost:3000/api/mcp";

/**
 * Checks if a live Next.js dev server is reachable at the target endpoint.
 */
async function isLiveServerRunning(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(1000),
    });
    // If it returns 401 or any HTTP response, server is running
    return res.status === 401 || res.status < 500;
  } catch {
    return false;
  }
}

/**
 * Spawns an in-process HTTP server wrapping the Next.js MCP route handlers
 * if an external server is not already active.
 */
async function startLocalMcpServer(
  mcpPost: (req: Request) => Promise<Response>,
  mcpGet: (req: Request) => Promise<Response>,
  mcpDelete: (req: Request) => Promise<Response>
): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer(async (req, res) => {
    try {
      const fullUrl = `http://${req.headers.host}${req.url}`;
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const webReq = new Request(fullUrl, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: (req.method === "POST" || req.method === "PUT") ? bodyBuffer : undefined,
        // @ts-ignore
        duplex: "half",
      });

      let webRes: Response;
      if (req.method === "POST") {
        webRes = await mcpPost(webReq);
      } else if (req.method === "GET") {
        webRes = await mcpGet(webReq);
      } else if (req.method === "DELETE") {
        webRes = await mcpDelete(webReq);
      } else {
        webRes = new Response("Method not allowed", { status: 405 });
      }

      res.statusCode = webRes.status;
      for (const [key, value] of webRes.headers.entries()) {
        res.setHeader(key, value);
      }

      if (webRes.body) {
        const reader = webRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch (err) {
      console.error("[mcp-server-wrapper] Request handler error:", err);
      res.statusCode = 500;
      res.end(String(err));
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as any).port;
  const url = `http://127.0.0.1:${port}/api/mcp`;

  return {
    url,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function runSmokeTest() {
  console.log("================================================================================");
  console.log(" Campus Career Copilot — MCP Streamable HTTP Smoke Test");
  console.log("================================================================================");
  console.log(`SDK Supported Protocol Versions: ${JSON.stringify(SUPPORTED_PROTOCOL_VERSIONS)}`);

  // Dynamically import route handlers and auth after dotenv loads
  const { mintDemoJudgeToken } = await import("../src/server/mcp-auth");
  const { POST: mcpPost, GET: mcpGet, DELETE: mcpDelete } = await import("../src/app/api/mcp/route");

  let targetUrl = DEFAULT_SERVER_URL;
  let closeServer: (() => Promise<void>) | null = null;

  const isLive = await isLiveServerRunning(DEFAULT_SERVER_URL);
  if (isLive) {
    console.log(`[i] Connected to active Next.js development server at: ${DEFAULT_SERVER_URL}`);
  } else {
    console.log(`[i] No active server detected at ${DEFAULT_SERVER_URL}. Starting in-process MCP server runner...`);
    const inProc = await startLocalMcpServer(mcpPost, mcpGet, mcpDelete);
    targetUrl = inProc.url;
    closeServer = inProc.close;
    console.log(`[i] In-process MCP server listening at: ${targetUrl}`);
  }

  try {
    // -------------------------------------------------------------------------
    // Step 1: Assert 401 when no token is passed
    // -------------------------------------------------------------------------
    console.log("\n[1/4] Verifying 401 Unauthorized for unauthenticated requests...");
    const unauthRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "smoke-test-unauth", version: "1.0.0" },
        },
      }),
    });

    console.log(`    Status received: ${unauthRes.status} ${unauthRes.statusText}`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, received ${unauthRes.status}`);
    }
    const unauthBody = await unauthRes.json();
    console.log(`    Error payload: ${JSON.stringify(unauthBody.error || unauthBody)}`);
    console.log("    [✓] PASS: Unauthenticated request rejected with HTTP 401");

    // -------------------------------------------------------------------------
    // Step 2: Mint judge token & connect client
    // -------------------------------------------------------------------------
    console.log("\n[2/4] Provisioning judge token and establishing Streamable HTTP transport...");
    const { token, email } = await mintDemoJudgeToken(60);
    console.log(`    Minted token for judge: ${email}`);

    const clientTransport = new StreamableHTTPClientTransport(new URL(targetUrl), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const client = new Client(
      { name: "career-pilot-smoke-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(clientTransport);

    const negotiatedProtocol = clientTransport.protocolVersion;
    console.log(`    [✓] Connected! Negotiated Protocol Version: ${negotiatedProtocol}`);

    if (!negotiatedProtocol || negotiatedProtocol < "2025-11-25") {
      throw new Error(
        `Protocol negotiation failed: expected >= '2025-11-25', got '${negotiatedProtocol}'`
      );
    }
    console.log("    [✓] PASS: MCP Protocol version 2025-11-25 successfully negotiated");

    // -------------------------------------------------------------------------
    // Step 3: List tools
    // -------------------------------------------------------------------------
    console.log("\n[3/4] Calling tools/list...");
    const toolsList = await client.listTools();
    const toolNames = toolsList.tools.map((t) => t.name);
    console.log(`    Tools found (${toolNames.length}): ${toolNames.join(", ")}`);

    const expectedTools = [
      "resume_analyzer",
      "internship_search",
      "tracker_add",
      "tracker_list",
      "study_plan",
      "dsa_next",
      "dsa_evaluate",
      "progress_summary",
    ];

    for (const exp of expectedTools) {
      if (!toolNames.includes(exp)) {
        throw new Error(`Missing expected tool: ${exp}`);
      }
    }
    console.log("    [✓] PASS: All 8 tools registered and exposed over MCP");

    // -------------------------------------------------------------------------
    // Step 4: Call a tool (dsa_next)
    // -------------------------------------------------------------------------
    console.log("\n[4/4] Executing tool call: dsa_next...");
    const callResult = await client.callTool({
      name: "dsa_next",
      arguments: {},
    });

    console.log("    Tool call completed!");
    const content = (callResult as any).content as Array<{ type: string; text?: string }> | undefined;
    console.log("    Result content items:", content?.length);

    if (!content || content.length === 0) {
      throw new Error("Tool returned empty content array");
    }

    const firstItem = content[0];
    if (firstItem.type === "text" && firstItem.text) {
      const parsed = JSON.parse(firstItem.text);
      console.log(`    Human-readable text summary: "${parsed.text}"`);
      console.log(`    Card type: "${parsed.structured?.card?.type}"`);
    } else {
      console.log("    Content payload:", firstItem);
    }

    if (callResult.isError) {
      throw new Error(`Tool returned error flag: ${JSON.stringify(callResult)}`);
    }
    console.log("    [✓] PASS: Tool execution succeeded with structured output");

    // Cleanup
    await client.close();

    console.log("\n================================================================================");
    console.log(" [✓] ALL MCP SMOKE TESTS PASSED SUCCESSFULLY");
    console.log("================================================================================\n");
  } finally {
    if (closeServer) {
      await closeServer();
    }
  }
}

runSmokeTest().catch((err) => {
  console.error("\n[!] MCP SMOKE TEST FAILED:", err);
  process.exit(1);
});
