"use client";
import { Combobox } from "@/registry/aing/ui/combobox";
import { Label } from "@/registry/aing/ui/label";
import { Search } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [value,setValue]=useState("");const options=[{value:"react",label:"React"},{value:"next",label:"Next.js"},{value:"vue",label:"Vue"},{value:"svelte",label:"Svelte"},{value:"angular",label:"Angular",disabled:true}];
 return <section data-form="combobox" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><Search aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Combobox</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 10</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><Label>프레임워크</Label><Combobox aria-label="Framework" options={options} value={value} onValueChange={setValue} placeholder="프레임워크 선택" className="mt-3"/></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{value ? `선택한 프레임워크 · ${value}` : "어떤 도구로 다음 아이디어를 만들까요?"}</footer></section>;
}
