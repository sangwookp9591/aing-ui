"use client";
import { useState } from "react";
import { Separator } from "@/registry/aing/ui/separator";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  const [replay, setReplay] = useState(0);
  return <div className="w-full rounded-xl border bg-card p-5"><p className="font-mono text-[10px] text-muted-foreground">A LITTLE BREATHING ROOM</p><h3 className="mt-2 text-[21px] font-semibold tracking-tight">Less noise. More clarity.</h3><p className="mt-2 text-[13px] text-muted-foreground">내용 사이, 딱 필요한 만큼의 여백.</p><Separator key={replay} decorative={false} aria-label="Project details" toolName="separator_demo" className="my-5" /><div className="flex h-5 items-center gap-4 text-[12px]"><span>Design</span><Separator orientation="vertical" /><span>Develop</span><Separator orientation="vertical" /><span>Share</span></div>{!compact && <p className="mt-5 text-[12px] leading-6 text-muted-foreground">가로·세로 구분선. 장식용 선은 접근성 트리와 도구 목록에서 제외합니다.</p>}{!compact && <button type="button" className="mt-4 rounded-md border px-3 py-2 text-[12px] hover:bg-muted" onClick={() => setReplay(value => value + 1)}>Replay reveal</button>}</div>;
}
