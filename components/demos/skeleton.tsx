"use client";
import { useState } from "react";
import { Skeleton } from "@/registry/aing/ui/skeleton";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(true);
  return <div className="w-full rounded-xl border bg-card p-5"><div className="mb-5 flex items-center justify-between"><p className="font-mono text-[10px] text-muted-foreground">WORTH THE WAIT</p><span role="status" className="text-[11px] text-muted-foreground">{loading ? "Loading…" : "Ready"}</span></div><div aria-busy={loading}>{loading ? <div className="space-y-5"><Skeleton className="h-32 w-full rounded-lg" /><div className="flex gap-3"><Skeleton className="size-10 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div></div> : <div className="flex h-[188px] flex-col justify-center rounded-lg border bg-muted/30 p-5"><h3 className="text-[23px] font-semibold tracking-tight">Everything in its place.</h3><p className="mt-3 text-[13px] text-muted-foreground">준비가 끝났습니다. 이어서 시작하세요.</p></div>}</div>{!compact && <button type="button" className="mt-5 rounded-md border px-3 py-2 text-[12px] hover:bg-muted" onClick={() => setLoading(!loading)}>{loading ? "Finish loading" : "Load again"}</button>}</div>;
}
