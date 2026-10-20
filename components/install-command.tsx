"use client";
import { mcpConfig } from "@/lib/copy-content";
import { useAingMotion } from "@/registry/aing/lib/motion";
import { Terminal } from "lucide-react";
import { motion } from "motion/react";
import { useId,useState,useSyncExternalStore } from "react";
import { CopyButton } from "./copy-button";
export function InstallCommand({name}:{name:string}) {
 const origin=useSyncExternalStore(subscribe,()=>window.location.origin,()=>"<origin>");
 const [tab,setTab]=useState("Agent");
 const id=useId(); const {transition}=useAingMotion();
 const url=`${origin}/r/${name}.json`;
 const command=tab==="MCP" ? JSON.stringify(mcpConfig(origin),null,2) : tab==="Agent" ? `이 레지스트리 주소로 shadcn add 해 줘: ${url}\n설치한 ${name} 컴포넌트의 사용 예도 보여 줘.` : `${tab==="pnpm" ? "pnpm dlx" : "npx"} shadcn@4.22.1 add ${url}`;
 return <div className="overflow-hidden rounded-lg border bg-card">
  <div className="flex items-center border-b px-2"><div role="tablist" aria-label={`${name} 설치 방법`} className="flex gap-0.5">{["Agent","pnpm","npm","MCP"].map((label,index,tabs)=><button key={label} type="button" role="tab" id={`${id}-${label}`} aria-controls={`${id}-panel`} aria-selected={tab===label} tabIndex={tab===label?0:-1} onClick={()=>setTab(label)} onKeyDown={e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const next=tabs[e.key==="Home"?0:e.key==="End"?tabs.length-1:(index+(e.key==="ArrowLeft"?tabs.length-1:1))%tabs.length];setTab(next);document.getElementById(`${id}-${next}`)?.focus();}}} className="relative px-2 py-2.5 font-mono text-[10px] text-muted-foreground aria-selected:text-foreground">{label}{tab===label&&<motion.span layoutId={`install-${id}`} className="absolute inset-x-1 bottom-0 h-0.5 bg-foreground" transition={transition}/>}</button>)}</div><div className="ml-auto"><CopyButton text={command} label="설치 명령 복사"/></div></div>
  <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} tabIndex={0} className="flex items-start gap-2 px-4 py-4"><Terminal aria-hidden size={13} className="mt-1 shrink-0 text-muted-foreground"/><code className="min-w-0 text-[11px] leading-6">{command}</code></div>
 </div>;
}
function subscribe(){return ()=>{};}
