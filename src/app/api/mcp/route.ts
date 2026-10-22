/**
 * src/app/api/mcp/route.ts
 *
 * Model Context Protocol (MCP) Streamable HTTP endpoint for Campus Career Pilot.
 * Implements MCP specification (version 2025-11-25) in stateless HTTP mode using
 * official @modelcontextprotocol/sdk.
 *
 * Exposes the unified tools registry from src/server/tools.ts:
 * 1. resume_analyzer
 * 2. internship_search
 * 3. tracker_add
 * 4. tracker_list
 * 5. study_plan
 * 6. dsa_next
 * 7. dsa_evaluate
 * 8. progress_summary
 *
 * Authentication:
 * Requires HTTP Bearer JWT token. Missing or invalid token yields HTTP 401.
 * userId is derived strictly from verified token claims and injected into tool handlers.
 */

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "@/server/tools";
import { authenticateMcpRequest } from "@/server/mcp-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Builds an McpServer instance bound to the authenticated user's session context.
 */
export function createCareerPilotMcpServer(userId: string): McpServer {
  const server = new McpServer(
    {
      name: "campus-career-pilot",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  for (const toolDef of tools) {
    server.tool(
      toolDef.name,
      toolDef.description,
      toolDef.inputSchema.shape,
      async (args: Record<string, unknown>) => {
        try {
          const result = await toolDef.handler(userId, args);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  text: result.text,
                  structured: result.structured,
                }),
              },
            ],
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: `Tool execution failed: ${message}`,
              },
            ],
          };
        }
      }
    );
  }

  return server;
}

/**
 * Unified request dispatcher handling authentication and stateless transport dispatch.
 */
async function handleMcpRequest(req: Request): Promise<Response> {
  const auth = await authenticateMcpRequest(req);
  if (!auth) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32002,
          message:
            "Unauthorized: Missing or invalid Bearer token. Obtain a token via scripts/mint-demo-token.ts",
        },
        id: null,
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="CampusCareerPilotMCP"',
        },
      }
    );
  }

  const server = createCareerPilotMcpServer(auth.userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function POST(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}

export async function GET(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
    },
  });
}
