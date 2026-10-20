"use client";
import { useState } from "react";
import { Progress } from "@/registry/aing/ui/progress";
import { ArrowUpRight } from "lucide-react";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState<number | null>(42);
  return <div className="w-full rounded-xl border bg-card p-5"><p className="font-mono text-[10px] text-muted-foreground">MAKING PROGRESS</p><div className="mt-3 flex items-end justify-between"><h3 className="text-[21px] font-semibold tracking-tight">Your next release.</h3><span className="font-mono text-[13px] tabular-nums">{value === null ? "…" : `${value}%`}</span></div><Progress aria-label="Release readiness" value={value} toolName="progress_demo" className="my-5" /><div className="flex items-center justify-between text-[12px] text-muted-foreground"><span>{value === 100 ? "Ready to ship" : "좋은 결과에 한 걸음 더 가까이."}</span><ArrowUpRight size={14} /></div>{!compact && <div className="mt-6 flex gap-2"><button type="button" className="rounded-md border px-3 py-2 text-[12px] hover:bg-muted" onClick={() => setValue(value === null || value === 100 ? 0 : Math.min(100, value + 20))}>Advance</button><button type="button" className="rounded-md border px-3 py-2 text-[12px] hover:bg-muted" onClick={() => setValue(value === null ? 42 : null)}>Indeterminate</button></div>}</div>;
}
