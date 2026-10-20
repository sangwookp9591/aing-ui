"use client";
import { getComponent } from "@/lib/catalog";
import { agentPrompt,mcpConfig,pageMarkdown } from "@/lib/copy-content";
import type { AingTool } from "@/registry/aing/lib/webmcp";
import { ChevronDown,ExternalLink } from "lucide-react";
import { useEffect,useRef,useState,useSyncExternalStore } from "react";
import { CopyButton } from "./copy-button";
const subscribe = () => () => {};
export function CopyPage({name}:{name:string}) {
 const origin=useSyncExternalStore(subscribe,()=>location.origin,()=>"<origin>");
 const [tools,setTools]=useState<Omit<AingTool,"execute">[]>([]);
 const menu=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const update=()=>setTools([...window.__aingToolDefinitions?.values() ?? []]); update(); window.addEventListener("aing:tools",update);return ()=>window.removeEventListener("aing:tools",update);},[]);
 const item=getComponent(name)!;
 const markdown=pageMarkdown(item,origin);
 const prefix=item.tools[0]?.[0]?.split("_")[0];
 const definitions=tools.filter(tool=>tool.name.startsWith(`${prefix}_`)).map(({name,description,inputSchema,annotations})=>({name,description,inputSchema,annotations}));
 const prompt=`${item.title} 컴포넌트를 설치하고 사용 예에 맞춰 구현해 줘. ${item.description} WebMCP 도구는 기본 등록됩니다. 문서를 읽어 주세요: ${origin}/docs/${name}`;
 return <div className="flex shrink-0 items-center rounded-md border bg-card">
  <CopyButton text={markdown} label="Copy page"/>
  <details ref={menu} className="relative border-l" onKeyDown={e=>{if(e.key==="Escape"){e.currentTarget.open=false;e.currentTarget.querySelector("summary")?.focus();}}}>
   <summary aria-label="Copy page 메뉴" className="grid size-8 list-none place-items-center rounded-r-md hover:bg-muted [&::-webkit-details-marker]:hidden"><ChevronDown aria-hidden size={13}/></summary>
   <div className="absolute right-0 top-10 z-40 grid w-56 gap-1 rounded-lg border bg-popover p-2 shadow-lg">
    <CopyButton text={markdown} label="Copy page Markdown"/>
    <CopyButton text={agentPrompt(item,origin)} label="Copy agent prompt"/>
    <CopyButton text={JSON.stringify(mcpConfig(origin),null,2)} label="Copy MCP config"/>
    <CopyButton text={JSON.stringify(definitions,null,2)} label="Copy WebMCP tools"/>
    {[['ChatGPT',`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`],['Claude',`https://claude.ai/new?q=${encodeURIComponent(prompt)}`]].map(([title,url])=><a key={title} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-2 py-2 text-[10px] hover:bg-muted">Open in {title}<ExternalLink aria-hidden size={11}/></a>)}
   </div>
  </details>
 </div>;
}
