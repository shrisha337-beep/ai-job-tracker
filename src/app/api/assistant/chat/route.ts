/**
 * src/app/api/assistant/chat/route.ts
 *
 * Streaming Assistant Chat Endpoint (SSE).
 *
 * Implements:
 * - NextAuth session authentication (userId derived strictly from session)
 * - LLM agent loop using getLlmProvider() and the unified tool registry
 * - Max 3 tool iterations per turn (1 tool = 1 service call)
 * - Strict system prompt grounding all metrics in tool outputs
 * - Memory across sessions: loads last 10 messages from previous session for new sessions
 * - Typed rate limit handling: answers from retrieved tool results on 429 with notice
 * - Structured SSE event streaming: tool_call, tool_result, delta, done, error
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLlmProvider, LlmMessage, LlmToolDefinition, LlmRateLimitError } from "@/lib/llm/provider";
import { tools, toolsByName } from "@/server/tools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Campus Career Pilot Assistant, an intelligent career advisor for college students.
Strict Invariants:
1. Numbers and metrics come ONLY from tool outputs; show sub-scores and underlying reasons for every metric.
2. Never invent or hallucinate a score, job listing, practice question, or deadline.
3. When answering questions regarding resume match, internships, study plans, DSA practice, or readiness, ALWAYS call the corresponding tool:
   - For next DSA question or coding challenge: ALWAYS call dsa_next (never call progress_summary for DSA challenges).
   - For readiness score or overall preparedness: call progress_summary.
   - For resume fit/skills: call resume_analyzer.
   - For internship search: call internship_search.
   - For tracker/applications: call tracker_list or tracker_add.
   - For daily preparation plan: call study_plan.
   - For evaluating a DSA answer: call dsa_evaluate.
4. After dsa_evaluate is called, explicitly explain what changed in the study plan, Leitner box level, or mastery score.
Keep your responses helpful, structured, concise, and actionable.`;

export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;
  let body: { message?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userMessageText = (body.message || "").trim();
  if (!userMessageText) {
    return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Session & Memory Management
  let chatSession = body.sessionId
    ? await prisma.chatSession.findFirst({
        where: { id: body.sessionId, userId },
      })
    : null;

  let crossSessionHistory: LlmMessage[] = [];

  if (!chatSession) {
    // New session: preload ONLY plain USER and ASSISTANT text messages from the previous session
    const prevSession = await prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        messages: {
          where: {
            role: { in: ["USER", "ASSISTANT"] },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (prevSession && prevSession.messages.length > 0) {
      const sortedPrev = [...prevSession.messages].reverse();
      crossSessionHistory = sortedPrev
        .filter((m) => (m.role === "USER" || m.role === "ASSISTANT") && Boolean(m.content?.trim()))
        .map((m) => ({
          role: m.role.toLowerCase() as "user" | "assistant",
          content: m.content.trim(),
        }));
    }

    chatSession = await prisma.chatSession.create({
      data: { userId },
    });
  } else {
    // Existing session: preload ONLY plain USER and ASSISTANT text messages
    const existingMessages = await prisma.chatMessage.findMany({
      where: {
        sessionId: chatSession.id,
        role: { in: ["USER", "ASSISTANT"] },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    crossSessionHistory = existingMessages
      .filter((m) => (m.role === "USER" || m.role === "ASSISTANT") && Boolean(m.content?.trim()))
      .map((m) => ({
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content.trim(),
      }));
  }

  // Persist incoming user message
  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: "USER",
      content: userMessageText,
    },
  });

  // Prepare Tools definition for LLM
  const llmTools: LlmToolDefinition[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.inputSchema.toJSONSchema() as Record<string, unknown>,
  }));

  // Build full message thread
  const conversationMessages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...crossSessionHistory,
    { role: "user", content: userMessageText },
  ];

  // Set up SSE streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (event: string, data: unknown) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    } catch {
      // client disconnected
    }
  };

  // Run async LLM tool loop
  (async () => {
    const executedToolResults: Array<{ name: string; text: string; card: unknown }> = [];
    const llm = getLlmProvider();

    try {
      let turnCompleted = false;
      let iterations = 0;
      const MAX_ITERATIONS = 3;

      while (!turnCompleted && iterations < MAX_ITERATIONS) {
        iterations++;
        const response = await llm.chat(conversationMessages, llmTools);

        if (response.toolCalls && response.toolCalls.length > 0) {
          // Assistant issued tool calls
          conversationMessages.push({
            role: "assistant",
            content: response.text || "",
            toolCalls: response.toolCalls,
          });

          for (const call of response.toolCalls) {
            await sendEvent("tool_call", {
              id: call.id,
              name: call.name,
              arguments: call.arguments,
            });

            const toolDef = toolsByName.get(call.name);
            let toolText = "";
            let cardData: unknown = null;

            if (toolDef) {
              try {
                const result = await toolDef.handler(userId, call.arguments);
                toolText = result.text;
                cardData = result.structured.card;
              } catch (toolErr: unknown) {
                const errMessage = toolErr instanceof Error ? toolErr.message : String(toolErr);
                toolText = `Tool error: ${errMessage}`;
              }
            } else {
              toolText = `Error: Tool '${call.name}' not found.`;
            }

            executedToolResults.push({
              name: call.name,
              text: toolText,
              card: cardData,
            });

            await sendEvent("tool_result", {
              id: call.id,
              name: call.name,
              text: toolText,
              card: cardData,
            });

            conversationMessages.push({
              role: "tool",
              content: toolText,
              name: call.name,
              toolCallId: call.id,
            });
          }
        } else {
          // Final assistant textual response
          const finalText = response.text || "";
          await sendEvent("delta", { text: finalText });

          await prisma.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: "ASSISTANT",
              content: finalText,
            },
          });

          turnCompleted = true;
          break;
        }
      }

      // If loop hit max iterations without final text, generate fallback synthesis
      if (!turnCompleted) {
        const fallbackText =
          executedToolResults.length > 0
            ? `Here is the summary of your requested information:\n\n` +
              executedToolResults.map((r) => `• **${r.name}**: ${r.text}`).join("\n\n")
            : "I have processed your request.";

        await sendEvent("delta", { text: fallbackText });

        await prisma.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            role: "ASSISTANT",
            content: fallbackText,
          },
        });
      }

      await sendEvent("done", { sessionId: chatSession.id });
    } catch (err: unknown) {
      console.error("[assistant:chat] Error in turn loop:", {
        name: (err as any)?.name || (err instanceof Error ? err.name : "UnknownError"),
        message: err instanceof Error ? err.message : String(err),
        status: (err as any)?.status,
        providerResponse: (err as any)?.responseBody || (err as any)?.response || (err as any)?.data,
      });

      const isRateLimit =
        err instanceof LlmRateLimitError ||
        (err as any)?.status === 429 ||
        (err as any)?.name === "LlmRateLimitError";

      if (isRateLimit) {
        let notice = "Notice: The AI service is currently rate limited (HTTP 429).";
        if (executedToolResults.length > 0) {
          notice +=
            "\n\nHere are the direct results from the tools executed for your query:\n\n" +
            executedToolResults.map((r) => `• **${r.name}**: ${r.text}`).join("\n\n");
        } else {
          notice += " Please try your request again in a few moments.";
        }

        await sendEvent("delta", { text: notice });

        await prisma.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            role: "ASSISTANT",
            content: notice,
          },
        });

        await sendEvent("done", { sessionId: chatSession.id });
      } else {
        // Never expose stack traces or raw errors
        await sendEvent("error", {
          message: "An unexpected error occurred while processing your query. Please try again.",
        });
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
