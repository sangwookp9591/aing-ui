"use client";
import { ReactionBar } from "@/registry/aing/ui/reaction-bar";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export default function ComponentDemo() {
  const [reactions, setReactions] = useState([
    { emoji: "👍", count: 12, active: false }, { emoji: "✨", count: 8, active: true }, { emoji: "💗", count: 3, active: false },
  ]);

  return <div className="w-full max-w-[420px] rounded-xl border bg-card p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full border bg-muted"><Sparkles aria-hidden size={14} /></span><div><p className="text-xs font-medium">새로운 대화의 방식</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">aing team · just now</p></div></div>
      <p className="mb-5 text-[13px] leading-6">사람이 누르는 버튼을 에이전트도 사용할 수 있다면? 작은 반응부터 시작해 보세요.</p>
      <ReactionBar toolName="reaction_demo" reactions={reactions} onAdd={(emoji) => setReactions((old) => old.some((r) => r.emoji === emoji) ? old : [...old, { emoji, count: 1, active: true }])} onToggle={(emoji) => setReactions((old) => old.map((r) => r.emoji === emoji ? { ...r, active: !r.active, count: r.count + (r.active ? -1 : 1) } : r))} />
    </div>;
}
