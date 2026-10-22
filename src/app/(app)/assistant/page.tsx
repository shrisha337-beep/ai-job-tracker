import { getRequiredSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AssistantClient, ChatUIMessage } from "./AssistantClient";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await getRequiredSession();
  const userId = session.user.id;

  // Retrieve user's latest active chat session with recent messages
  const latestSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 20,
      },
    },
  });

  const initialMessages: ChatUIMessage[] = (latestSession?.messages || [])
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));

  return (
    <AssistantClient
      userName={session.user.name || session.user.email || "there"}
      initialSessionId={latestSession?.id}
      initialMessages={initialMessages}
    />
  );
}
