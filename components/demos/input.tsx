"use client";
import { Input } from "@/registry/aing/ui/input";
import { Label } from "@/registry/aing/ui/label";
import { AtSign } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [value,setValue]=useState("");
 return <section data-form="input" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><AtSign aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Input</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 02</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><Label htmlFor="workspace-name">워크스페이스 이름</Label><Input id="workspace-name" aria-label="Workspace name" placeholder="예: Studio North" value={value} maxLength={60} onChange={e=>setValue(e.target.value)} className="mt-3"/></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{`${value.length} / 60 · ${value || "이름을 입력해 보세요."}`}</footer></section>;
}
