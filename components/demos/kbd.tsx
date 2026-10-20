"use client";
import { Kbd, KbdGroup } from "@/registry/aing/ui/kbd";
import { Search } from "lucide-react";
export default function ComponentDemo({ compact = false }: { compact?: boolean }) {
  return <div className="w-full rounded-xl border bg-card p-5"><p className="font-mono text-[10px] text-muted-foreground">STAY IN YOUR FLOW</p><h3 className="mt-2 text-[21px] font-semibold tracking-tight">A shortcut to everything.</h3><div className="mt-5 flex items-center gap-2 rounded-lg border bg-background p-3 text-[13px] text-muted-foreground"><Search size={15} /><span className="mr-auto">Quick search</span><KbdGroup><Kbd aria-label="Command" toolName="kbd_demo">⌘</Kbd><Kbd webmcp={false}>K</Kbd></KbdGroup></div>{!compact && <div className="mt-5 flex items-center justify-between border-t pt-4 text-[12px] text-muted-foreground"><span>Close dialog</span><Kbd webmcp={false}>Esc</Kbd></div>}<p className="mt-4 text-[12px] leading-6 text-muted-foreground">키보드 표시는 설명용입니다. 실제 단축키는 앱에서 연결하세요.</p></div>;
}
