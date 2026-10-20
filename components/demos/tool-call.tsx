"use client";
import { ToolCall } from "@/registry/aing/ui/tool-call";
import { Bot,RotateCcw } from "lucide-react";
import { useEffect,useRef,useState } from "react";

export default function ComponentDemo({ compact = false }: {compact?: boolean}) {
  const [callStatus, setCallStatus] = useState<"pending" | "running" | "success" | "error">("pending");
  const [callOutput, setCallOutput] = useState<unknown>();
  const [duration, setDuration] = useState<number>();
  const callTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (callTimer.current) clearTimeout(callTimer.current); }, []);

  return <div className="w-full max-w-[460px] space-y-4">
      <div className="mb-5 flex items-center justify-between"><span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><Bot aria-hidden size={13} />AGENT REQUEST</span><button type="button" aria-label="승인 데모 초기화" onClick={() => { if (callTimer.current) clearTimeout(callTimer.current); setCallStatus("pending"); setCallOutput(undefined); setDuration(undefined); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><RotateCcw aria-hidden size={13} /></button></div>
      <ToolCall toolName="toolcall_demo" name="write_component" kind="filesystem" input={{ path: "components/ui/card.tsx", action: "update" }} description="카드 컴포넌트를 업데이트합니다. 파일 변경 전 승인이 필요합니다." status={callStatus} output={callOutput} durationMs={duration} consequentialHint onApprove={() => { const start = performance.now(); setCallStatus("running"); callTimer.current = setTimeout(() => { setCallOutput({ updated: true, source: "로컬 상태 데모 · 실제 파일은 수정하지 않음" }); setDuration(Math.round(performance.now() - start)); setCallStatus("success"); }, 800); }} onDeny={() => { setCallOutput({ denied: true, executed: false }); setCallStatus("error"); }} />
      {!compact && <ToolCall webmcp={false} name="search_components" kind="registry" input={{ query: "WebMCP" }} output={{ found: 5 }} status="success" durationMs={124} />}
    </div>;
}
