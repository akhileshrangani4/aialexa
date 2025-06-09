import { notFound } from "next/navigation";
import { Chatbot } from "@prisma/client";
import { db } from "@/lib/db";

interface ChatbotSettingsProps {
  params: { chatbotId: string };
}

async function getChatbot(chatbotId: Chatbot["id"]) {
  return await db.chatbot.findUnique({
    where: {
      id: chatbotId,
    },
  });
}
export default async function ChatbotPage({ params }: ChatbotSettingsProps) {
  const chatbot = await getChatbot(params.chatbotId);

  if (!chatbot) {
    notFound();
  }

  return (
    <div className="flex flex-col h-svh">
      <nav className="w-full px-6 py-4 shadow-sm bg-white">
        <h1 className="text-base font-medium text-gray-800">AI Tutor</h1>
      </nav>
      <div className="flex-1 ">
        <iframe
          src={`/embed/${chatbot.id}/window?chatbox=false`}
          className="w-full h-full border-none"
          allowFullScreen
          allow="clipboard-read; clipboard-write"></iframe>
      </div>
    </div>
  );
}
