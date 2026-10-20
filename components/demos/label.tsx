"use client";
import { Label } from "@/registry/aing/ui/label";
import { Input } from "@/registry/aing/ui/input";
import { Type } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [value,setValue]=useState("");
 return <section data-form="label" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><Type aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Label</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 04</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><Label htmlFor="label-example">표시 이름 <span className="text-muted-foreground font-normal">선택</span></Label><Input webmcp={false} id="label-example" aria-label="표시 이름" placeholder="라벨을 눌러 포커스하세요" value={value} onChange={e=>setValue(e.target.value)} className="mt-3"/></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{value ? `안녕하세요, ${value}님.` : "라벨과 입력은 htmlFor / id로 연결됩니다."}</footer></section>;
}
