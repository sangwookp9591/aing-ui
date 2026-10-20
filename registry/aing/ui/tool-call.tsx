"use client";
import { easeOut,useAingMotion } from "@/registry/aing/lib/motion";
import { result,toolName,useWebMCPTool,type WebMCPProps } from "@/registry/aing/lib/webmcp";
import { Check,ChevronDown,LoaderCircle,ShieldCheck,Terminal,X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect,useId,useRef,useState,type ComponentProps } from "react";
export { useWebMCPToolLog } from "@/registry/aing/lib/webmcp";
export type ToolCallProps = ComponentProps<"details"> & WebMCPProps & {
  name: string;
  input: unknown;
  output?: unknown;
  status: "pending" | "running" | "success" | "error";
  description?: string;
  kind?: string;
  durationMs?: number;
  consequentialHint?: boolean;
  onApprove?: () => void | Promise<void>;
  onDeny?: () => void | Promise<void>;
};
const labels = { pending: "승인 대기", running: "실행 중", success: "완료", error: "실패" };
export function ToolCall({ name, input, output, status, description, kind = "tool", durationMs, consequentialHint = false, onApprove, onDeny, toolName: customName, webmcp, className = "", open, ref, ...props }: ToolCallProps) {
  const id = useId();
  const { reduced, transition, entrance } = useAingMotion();
  const [expanded, setExpanded] = useState(status === "pending" || status === "running");
  const details = useRef<HTMLDetailsElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const [holding, setHolding] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (details.current) details.current.open = open ?? (status === "pending" || status === "running");
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [status, open]);
  useWebMCPTool(webmcp === false ? null : {
    name: toolName("toolcall_get_result", id, { toolName: customName, webmcp }, "", props["aria-label"] ?? name),
    description: webmcp?.description ?? `도구 호출의 입력, 결과, 상태를 읽습니다. · ${name}`,
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => result({ name, input, output, status }),
  });
  const cancelHold = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const decide = async (action?: () => void | Promise<void>) => {
    if (!action || locked.current || status !== "pending") return;
    locked.current = true;
    setBusy(true); setError(""); setConfirm(false);
    cancelHold();
    try { await action(); }
    catch (err) { setError(err instanceof Error ? err.message : "도구 승인에 실패했습니다."); }
    finally { locked.current = false; setBusy(false); }
  };
  const Icon = status === "success" ? Check : status === "error" ? X : status === "running" ? LoaderCircle : Terminal;
  return (
    <motion.div layout {...entrance} transition={transition}><details {...props} onToggle={e => {setExpanded(e.currentTarget.open); props.onToggle?.(e);}} ref={(node) => { details.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node; }} className={`group min-w-0 w-full max-w-[460px] rounded-xl border bg-card text-card-foreground shadow-xs ${className}`}>
      <summary className="flex min-h-14 list-none items-center gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted">{status === "success" ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><motion.path d="m5 12 4 4L19 6" initial={{pathLength:0}} animate={{pathLength:1}} transition={reduced ? {duration:0} : easeOut} /></svg> : <Icon aria-hidden size={15} className={status === "running" && !reduced ? "animate-spin" : ""} />}</span>
        <span className="min-w-0 flex-1 break-all text-[13px] font-medium">{name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{status === "pending" ? kind : durationMs !== undefined ? `${durationMs}ms` : kind}</span>
        <span role="status" className="sr-only">{labels[status]}</span>
        <motion.span animate={{rotate:expanded ? 180 : 0}} transition={transition}><ChevronDown aria-hidden size={14} className="shrink-0 text-muted-foreground" /></motion.span>
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <pre aria-label="도구 입력" className="rounded-md border bg-muted/50 px-3 py-2.5 font-mono text-[11px] leading-5 whitespace-pre-wrap break-all">{JSON.stringify(input, null, status === "pending" || status === "running" ? undefined : 2)}</pre>
        <p className="text-xs leading-5 text-muted-foreground">{description ?? "에이전트가 요청한 작업의 입력과 결과를 확인하세요."}</p>
        {status === "pending" && (onApprove || onDeny) && <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck aria-hidden size={13} />{consequentialHint ? "길게 눌러 승인 · 키보드는 확인 2회" : "실행 전 사용자 승인"}</span>
          <div className="ml-auto flex gap-2">
            {onDeny && <button type="button" disabled={busy} onClick={() => void decide(onDeny)} className="rounded-md px-3 py-2 text-xs hover:bg-muted disabled:opacity-50">Deny</button>}
            {onApprove && <button type="button" disabled={busy} aria-label={consequentialHint ? "Allow 길게 눌러 승인" : "Allow"}
              onPointerDown={(e) => {
                if (!consequentialHint || e.button !== 0 || busy) return;
                cancelHold(); setHolding(true);
                timer.current = setTimeout(() => { void decide(onApprove); }, 900);
              }}
              onPointerUp={cancelHold} onPointerLeave={cancelHold} onPointerCancel={cancelHold}
              onBlur={() => { cancelHold(); setConfirm(false); }}
              onClick={(e) => {
                if (!consequentialHint) { void decide(onApprove); return; }
                if (e.detail !== 0) return;
                if (confirm) void decide(onApprove); else setConfirm(true);
              }}
              className="relative overflow-hidden rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-50 select-none touch-none">
              <motion.span aria-hidden className="absolute inset-0 origin-left bg-primary-foreground/20" initial={false} animate={{ scaleX: holding ? 1 : 0 }} transition={{ duration: reduced ? 0 : holding ? 0.9 : 0, ease: "linear" }} />
              <span className="relative">{busy ? "처리 중…" : confirm ? "확인 · Allow" : "Allow"}</span>
            </button>}
          </div>
        </div>}
        {status === "running" && <p className="text-xs text-muted-foreground">도구를 실행하고 있습니다…</p>}
        {(status === "success" || status === "error") && <div><p className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">Output · {labels[status]}</p><pre className="rounded-md bg-muted/50 p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap break-all">{output === undefined ? "아직 결과가 없습니다." : JSON.stringify(output, null, 2)}</pre></div>}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
    </details></motion.div>
  );
}
