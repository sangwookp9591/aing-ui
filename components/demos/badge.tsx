"use client";
import { useState } from "react";
import { Badge } from "@/registry/aing/ui/badge";
import { Check, ArrowUpRight, Circle } from "lucide-react";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  const [published, setPublished] = useState(false);
  return <div className="w-full rounded-xl border bg-card p-5"><div className="mb-5 flex items-center justify-between"><p className="font-mono text-[10px] text-muted-foreground">PROJECT STATUS</p><Badge variant={published ? "default" : "secondary"} toolName="badge_demo">{published ? <Check size={11} /> : <Circle size={9} />}{published ? "Published" : "In review"}</Badge></div><h3 className="text-[21px] font-semibold tracking-tight">Design system v2</h3><p className="mt-2 text-[13px] leading-6 text-muted-foreground">작은 상태 하나도, 분명하게.</p><div className="mt-5 flex flex-wrap gap-2"><Badge webmcp={false} variant="outline">React 19</Badge><Badge webmcp={false} variant="secondary">WebMCP</Badge><Badge webmcp={false} variant="destructive">2 changes requested</Badge></div>{!compact && <button type="button" onClick={() => setPublished(!published)} className="mt-6 flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-[12px] hover:bg-muted">{published ? "Move to review" : "Publish update"}<ArrowUpRight size={13} /></button>}</div>;
}
