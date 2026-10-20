"use client";
import { catalog,getComponent } from "@/lib/catalog";
import { listWebMCPTools, subscribeWebMCPTools, type AingTool } from "@/registry/aing/lib/webmcp";
import { ToolCall,useWebMCPToolLog } from "@/registry/aing/ui/tool-call";
import { Check,ChevronDown,Command,Play } from "lucide-react";
import { useEffect,useState } from "react";

import { useAingMotion } from "@/registry/aing/lib/motion";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { CodeBlock } from "./copy-button";
const demos = Object.fromEntries(catalog.map(item => [item.name, dynamic(item.demo)]));
export function Demo({ name, compact = false }: { name: string; compact?: boolean }) {
 const [styling, setStyling] = useState<"css" | "tailwind">("css");
 const [tab, setTab] = useState("Preview");
 const {transition} = useAingMotion();
 const Component = demos[name];
 const content = Component ? <Component compact={compact} styling={styling} /> : null;
  if (compact) return <div data-mini={name} className="preview-grid flex min-h-[390px] flex-1 items-center justify-center p-5"><div className="w-full max-w-[460px]">{content}</div></div>;
  return <div>
    {getComponent(name)?.platform && <fieldset className="mb-4 flex items-center gap-4 text-xs">
      <legend className="mb-2 text-muted-foreground">스타일</legend>
      {(["css", "tailwind"] as const).map(value => <label key={value} className="flex items-center gap-2">
        <input type="radio" name={`styling-${name}`} value={value} checked={styling === value}
          onChange={() => setStyling(value)} />{value === "css" ? "순수 CSS" : "Tailwind v4"}
      </label>)}
    </fieldset>}
    <div role="tablist" aria-label="컴포넌트 미리보기" className="mb-3 flex w-fit gap-1 rounded-lg bg-muted p-1">
      {["Preview", "Code"].map((label) => <button key={label} type="button" role="tab" id={`${name}-${label}`} aria-controls={`${name}-panel`} aria-selected={tab === label} tabIndex={tab === label ? 0 : -1} onKeyDown={(e) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) { e.preventDefault(); const next = label === "Preview" ? "Code" : "Preview"; setTab(next); document.getElementById(`${name}-${next}`)?.focus(); } }} onClick={() => setTab(label)} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs relative isolate">{tab === label && <motion.span layoutId={`preview-${name}`} className="absolute inset-0 -z-10 rounded-md bg-background shadow-xs" transition={transition} />}{label}</button>)}
    </div>
    <div id={`${name}-panel`} role="tabpanel" aria-labelledby={`${name}-${tab}`} tabIndex={0} className="overflow-hidden rounded-xl border">
      <div data-demo data-styling={styling} hidden={tab !== "Preview"} className="preview-grid relative min-h-[440px] px-5 py-14 sm:px-10">
        <span className="absolute top-4 left-4 flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground"><span className="size-1.5 rounded-full bg-[#33cc33]" />LIVE PREVIEW</span>
        <span className="absolute top-4 right-4 font-mono text-[9px] text-muted-foreground">{name === "tool-call" ? "PRESS & HOLD" : "INTERACTIVE"}</span>
        <div className="mx-auto flex min-h-[330px] max-w-[460px] items-center">{content}</div>
      </div>
      {tab === "Code" && <CodeBlock className="min-h-[440px]" code={getComponent(name)?.code ?? ""} />}
    </div>
    <AgentPanel />
  </div>;
}
export function AgentPanel() {
  const [tools, setTools] = useState<AingTool[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [request, setRequest] = useState<{ tool: AingTool; input: Record<string, unknown> } | null>(null);
  const logs = useWebMCPToolLog();
  useEffect(() => {
    let active = true, revision = 0;
    const update = () => { const current = ++revision; void listWebMCPTools().then(items => { if (active && current === revision) setTools(items); }).catch(err => { if (active) setError(err instanceof Error ? err.message : "도구 목록을 읽을 수 없습니다."); }); };
    const unsubscribe = subscribeWebMCPTools(update); update();
    return () => { active = false; unsubscribe(); };
  }, []);
  const execute = async (tool: AingTool, input: Record<string, unknown>) => {
    setRunning(tool.name); setError(""); setRequest(null);
    try { await tool.execute(input, { signal: new AbortController().signal }); }
    catch (err) { setError(err instanceof Error ? err.message : "실행에 실패했습니다."); }
    finally { setRunning(null); }
  };
  return <details className="mt-3 rounded-lg border bg-card text-card-foreground" aria-label="Agent 패널">
    <summary className="flex list-none items-center gap-2 px-4 py-3 text-xs [&::-webkit-details-marker]:hidden"><Command aria-hidden size={14} /><h2 className="font-medium">Agent 패널</h2><span className="ml-auto font-mono text-[10px] text-muted-foreground">{tools.length} tools</span><ChevronDown aria-hidden size={13} /></summary>
    <div className="border-t p-4"><p className="mb-4 text-[11px] leading-6 text-muted-foreground">네이티브 WebMCP와 개발용 폴백의 실제 도구입니다. 중요한 쓰기 도구는 승인 후 실행합니다.</p>
      <input aria-label="도구 검색" placeholder="도구 이름이나 설명으로 검색…" value={query} onChange={e => setQuery(e.target.value)} className="mb-4 w-full rounded-md border bg-background px-3 py-2 text-xs" /><div className="space-y-2">{[...new Set(tools.map(tool => tool.name.split("_")[0]))].sort().map(group => <section key={group} aria-label={`${group} 도구`} className="space-y-2"><h3 className="pt-3 font-mono text-[10px] uppercase text-muted-foreground">{group}</h3>{tools.filter(tool => tool.name.startsWith(`${group}_`)).filter(tool => `${tool.name} ${tool.description}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name)).map((tool) => <div key={tool.name} className="flex items-center gap-3 rounded-md border px-3 py-2.5"><div className="min-w-0 flex-1"><p className="break-all font-mono text-[10px]">{tool.name}</p><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{tool.description}</p></div><button type="button" aria-label={`${tool.name} 실행`} disabled={running !== null || request !== null} className="grid size-8 shrink-0 place-items-center rounded-md border hover:bg-muted disabled:opacity-50" onClick={() => {
        const input: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(tool.inputSchema.properties)) { const property = value as { enum?: unknown[]; type?: string; minimum?: number }; input[key] = property.enum?.[0] ?? (property.type === "boolean" ? true : property.type === "number" || property.type === "integer" ? property.minimum ?? 5 : "에이전트가 보낸 메시지입니다."); }
        if (tool.annotations?.consequentialHint) setRequest({ tool, input }); else void execute(tool, input);
      }}>{running === tool.name ? <span className="text-[9px]">실행 중</span> : <Play aria-hidden size={12} />}</button></div>)}</section>)}</div>
      {request && <div className="mx-auto mt-5 max-w-[460px]"><ToolCall key={request.tool.name} webmcp={false} name={request.tool.name} input={request.input} description={request.tool.description} status="pending" consequentialHint={request.tool.annotations?.consequentialHint} onApprove={() => execute(request.tool, request.input)} onDeny={() => setRequest(null)} /></div>}
      {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
      <div aria-live="polite" aria-label="도구 호출 기록" className="mt-5 space-y-3">{logs.length === 0 && <p className="py-3 text-center text-[11px] text-muted-foreground">도구를 실행하면 여기에 기록됩니다.</p>}{logs.slice(0, 5).map((log) => <ToolCall key={log.id} {...log} webmcp={false} />)}</div>
      <p className="mt-4 flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground"><Check aria-hidden size={11} />Same action. Human or agent.</p>
    </div>
  </details>;
}
