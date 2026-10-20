"use client";
import { Textarea } from "@/registry/aing/ui/textarea";
import { Label } from "@/registry/aing/ui/label";
import { AlignLeft } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [value,setValue]=useState("");
 return <section data-form="textarea" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><AlignLeft aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Textarea</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 03</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><Label htmlFor="project-brief">프로젝트 소개</Label><Textarea id="project-brief" aria-label="Project brief" placeholder="어떤 아이디어를 만들고 있나요?" maxLength={500} value={value} onChange={e=>setValue(e.target.value)} className="mt-3"/></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{`${value.length} / 500 · 짧고 명확하게 소개해 주세요.`}</footer></section>;
}
