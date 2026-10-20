"use client";
import { Checkbox } from "@/registry/aing/ui/checkbox";
import { Label } from "@/registry/aing/ui/label";
import { ListChecks } from "lucide-react";
import { useState } from "react";
export default function ComponentDemo({compact=false}:{compact?:boolean}){
 const [checked,setChecked]=useState<boolean|"indeterminate">(false);
 return <section data-form="checkbox" className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"><header className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-8 place-items-center rounded-md border bg-muted/40"><ListChecks aria-hidden size={15}/></span><div><h3 className="text-[13px] font-medium">Checkbox</h3><p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 05</p></div><span className="ml-auto size-1.5 rounded-full bg-foreground/50"/></header><div className={compact?"p-4":"p-5"}><div className="flex items-start gap-3"><Checkbox id="notifications" aria-label="Email updates" checked={checked} onCheckedChange={setChecked}/><div><Label htmlFor="notifications">새 소식을 이메일로 받기</Label><p className="mt-2 text-xs leading-5 text-muted-foreground">새로운 컴포넌트와 업데이트만 보내드려요.</p></div></div></div><footer aria-live="polite" className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground">{checked ? "이메일 알림이 켜졌습니다." : "이메일 알림이 꺼져 있습니다."}</footer></section>;
}
