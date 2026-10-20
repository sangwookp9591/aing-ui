"use client";
import { ProgressTracker,type Step } from "@/registry/aing/ui/progress-tracker";
import { useState } from "react";

export default function ComponentDemo({ compact = false }: {compact?: boolean}) {
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [steps, setSteps] = useState<Step[]>([
    { id: "plan", label: "요청 분석", status: "done", meta: "0.4s · 3 files" },
    { id: "build", label: "컴포넌트 생성", status: "active", meta: "진행 중 · React" },
    { id: "share", label: "결과 검증", status: "todo", meta: "대기 · TypeScript" },
  ]);

  return <div className="w-full space-y-3">{!compact && <div className="flex justify-end gap-1">{(["vertical", "horizontal"] as const).map((value) => <button type="button" key={value} aria-label={`${value} 배치`} aria-pressed={orientation === value} className="rounded-md border bg-card px-2.5 py-1.5 font-mono text-[9px] text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground" onClick={() => setOrientation(value)}>{value}</button>)}</div>}<ProgressTracker orientation={orientation} toolName="progress_demo" steps={steps} onAdvance={() => setSteps((old) => { const index = old.findIndex((s) => s.status !== "done"); return old.map((s, i) => i === index ? { ...s, status: "done", meta: "0.8s · completed" } : i === index + 1 ? { ...s, status: "active", meta: "진행 중" } : s); })} /></div>;
}
