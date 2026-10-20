"use client";
import { Slider } from "@/registry/aing/ui/slider";
import { Label } from "@/registry/aing/ui/label";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [value,setValue]=useState([40]);
 return <section data-form="slider" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><SlidersHorizontal aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Slider</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 09</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><div className="flex items-center justify-between"><Label>재생 볼륨</Label><span className="font-mono text-xs">{value[0]}%</span></div><Slider aria-label="Volume" value={value} min={0} max={100} step={5} onValueChange={setValue} className="mt-6"/></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{`${value[0]}% · 방향키로 5씩 조절할 수 있어요.`}</footer></section>;
}
