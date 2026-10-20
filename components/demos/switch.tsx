"use client";
import { Switch } from "@/registry/aing/ui/switch";
import { Label } from "@/registry/aing/ui/label";
import { Bell } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [checked,setChecked]=useState(false);
 return <section data-form="switch" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><Bell aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Switch</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 07</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><div className="flex items-center justify-between gap-5"><div><Label htmlFor="quiet-mode">집중 모드</Label><p className="mt-2 text-xs leading-5 text-muted-foreground">알림을 잠시 멈추고 작업에 집중하세요.</p></div><Switch id="quiet-mode" aria-label="Focus mode" checked={checked} onCheckedChange={setChecked}/></div></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{checked ? "집중 모드가 켜졌습니다." : "모든 알림을 받고 있습니다."}</footer></section>;
}
