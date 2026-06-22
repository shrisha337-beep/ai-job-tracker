import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatRole, Status } from "@prisma/client";

// GET /api/chat - Fetch chat messages history for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/chat - Send a message to the chatbot
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // 1. Save user message to database
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: ChatRole.USER,
        content: message.trim(),
      },
    });

    let assistantResponseText = "";
    let actionResult: any = null;

    // 2. n8n integration check
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.N8N_WEBHOOK_SECRET || ""}`,
          },
          body: JSON.stringify({
            userId,
            message: message.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          assistantResponseText = data.reply || data.content || data.message || "";
          actionResult = data.action || null;
        } else {
          console.error("n8n responded with an error:", await response.text());
        }
      } catch (err) {
        console.error("Failed to connect to n8n webhook:", err);
      }
    }

    // 3. Fallback mock intelligence engine for local/offline testing
    if (!assistantResponseText) {
      const trimmedMsg = message.toLowerCase().trim();

      // Mock Command 1: Move application to a new status
      // e.g. "move google to interview" or "update stripe to applied"
      const moveMatch = trimmedMsg.match(/(?:move|update|change)\s+([a-zA-Z0-9\s]+)\s+to\s+(bookmarked|applied|screening|interview|offer|rejected)/i);

      if (moveMatch) {
        const companyName = moveMatch[1].trim();
        const targetStatus = moveMatch[2].toUpperCase() as Status;

        // Find user application for this company
        const application = await prisma.application.findFirst({
          where: {
            userId,
            company: { contains: companyName, mode: "insensitive" },
          },
        });

        if (application) {
          const updatedApp = await prisma.application.update({
            where: { id: application.id },
            data: { status: targetStatus },
          });

          assistantResponseText = `Successfully moved **${updatedApp.company}** (${updatedApp.role}) to **${targetStatus}** status! I've updated your Kanban board.`;
          actionResult = {
            type: "MOVE_APPLICATION",
            applicationId: updatedApp.id,
            company: updatedApp.company,
            role: updatedApp.role,
            status: targetStatus,
          };
        } else {
          assistantResponseText = `I couldn't find any application for **"${companyName}"** in your pipeline. Double check the spelling or type "show pipeline" to see all your active applications.`;
        }
      } 
      // Mock Command 2: Show list of applications
      else if (trimmedMsg.includes("pipeline") || trimmedMsg.includes("applications") || trimmedMsg.includes("show my jobs")) {
        const apps = await prisma.application.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 5,
        });

        if (apps.length === 0) {
          assistantResponseText = "Your job tracking pipeline is currently empty! Try adding some job applications first by clicking **\"Add Application\"** on the dashboard.";
        } else {
          const appList = apps
            .map((app) => `- **${app.company}** — *${app.role}* (${app.status.toLowerCase()})`)
            .join("\n");
          assistantResponseText = `Here are your 5 most recent job applications:\n\n${appList}\n\nAsk me to move any of them (e.g. *"Move Google to Interview"*) and I'll handle it!`;
        }
      }
      // Mock Command 3: Help menu
      else if (trimmedMsg.includes("help") || trimmedMsg.includes("what can you do") || trimmedMsg.includes("features")) {
        assistantResponseText = `I am your **AI Job Tracker Command Center Bot**. Here is what I can help you with:\n\n` +
          `1. **Move applications**: Try *"Move Stripe to Screening"* or *"Change Google status to Interview"*.\n` +
          `2. **View pipeline**: Try *"Show my pipeline"* to see recent applications.\n` +
          `3. **Add Application**: You can ask me to track a role (coming soon via n8n!).\n` +
          `4. **Optimize Resume**: Suggest resume improvements based on a job description.\n\n` +
          `*Note: I am running in local testing mode. Once n8n is hooked up, I can fetch jobs from LinkedIn, sync with Google Calendar, and send push notifications!*`;
      }
      // General response
      else {
        assistantResponseText = `Hello! I received your message: "${message}".\n\nI can help you manage your job search pipeline. Try typing **"help"** to see what commands you can run!`;
      }
    }

    // 4. Save assistant response to database
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId,
        role: ChatRole.ASSISTANT,
        content: assistantResponseText,
        metadata: actionResult ? JSON.stringify(actionResult) : undefined,
      },
    });

    return NextResponse.json({
      message: assistantMessage,
      action: actionResult,
    });
  } catch (error: any) {
    console.error("Error processing chat message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
