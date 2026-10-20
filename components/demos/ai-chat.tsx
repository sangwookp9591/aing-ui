"use client";
import { AIChat,type ChatMessage } from "@/registry/aing/ui/ai-chat";
import { useEffect,useRef,useState } from "react";

export default function ComponentDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "question", role: "user", content: "내 앱에 에이전트를 연결하고 싶어요." },
    { id: "welcome", role: "assistant", content: "좋아요. UI의 동작을 도구로 열어 보세요. 사용자는 클릭하고, 에이전트는 같은 함수를 호출합니다." },
  ]);
  const [pending, setPending] = useState(false);
  const stream = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {if (stream.current) clearInterval(stream.current);}, []);
  const stop = () => { if (stream.current) clearInterval(stream.current); stream.current = null; setPending(false); };
  const send = (text: string) => {
    const id = crypto.randomUUID();
    setMessages((old) => [...old, { id: crypto.randomUUID(), role: "user", content: text }, { id, role: "assistant", content: "" }]);
    setPending(true);
    const reply = "좋아요. 작은 컴포넌트 하나부터 함께 시작해 봐요. 이 답변은 로컬 스트리밍 데모입니다.";
    let index = 0;
    stream.current = setInterval(() => {
      index += 3;
      setMessages((old) => old.map((m) => m.id === id ? { ...m, content: reply.slice(0, index) } : m));
      if (index >= reply.length) stop();
    }, 40);
  };

  return <AIChat toolName="chat_demo" messages={messages} onSend={send} onStop={stop} pending={pending} />;
}
