"use client";
import { RadioGroup, RadioGroupItem } from "@/registry/aing/ui/radio-group";
import { Label } from "@/registry/aing/ui/label";
import { CircleDot } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [value,setValue]=useState("starter");
 return <section data-form="radio-group" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><CircleDot aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Radio Group</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 06</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><RadioGroup aria-label="Workspace plan" value={value} onValueChange={setValue}>{[{value:"starter",label:"Starter",detail:"가볍게 시작하는 개인 작업"},{value:"studio",label:"Studio",detail:"팀과 함께 만드는 공간"},{value:"enterprise",label:"Enterprise",detail:"출시 예정",disabled:true}].map(option=><Label key={option.value} htmlFor={`plan-${option.value}`} className="flex cursor-pointer items-center gap-3 rounded-md border p-3"><RadioGroupItem id={`plan-${option.value}`} value={option.value} disabled={option.disabled}/><span>{option.label}<span className="mt-1.5 block text-xs font-normal text-muted-foreground">{option.detail}</span></span></Label>)}</RadioGroup></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{`선택한 플랜 · ${value}`}</footer></section>;
}
