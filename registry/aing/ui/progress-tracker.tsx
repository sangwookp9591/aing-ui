"use client";
import { easeOut,spring,useAingMotion } from "@/registry/aing/lib/motion";
import {
result,
toolName,
useWebMCPTool,
type WebMCPProps,
} from "@/registry/aing/lib/webmcp";
import { ArrowRight,X } from "lucide-react";
import { animate,motion,useMotionValue,useTransform } from "motion/react";
import { useEffect,useId,useState,type ComponentProps } from "react";
export type Step = {
  id: string;
  label: string;
  meta?: string;
  status: "todo" | "active" | "done" | "error";
};
export type ProgressTrackerProps = ComponentProps<"div"> &
  WebMCPProps & {
    steps: Step[];
    orientation?: "horizontal" | "vertical";
    onAdvance?: () => void | Promise<void>;
  };
const labels = { todo: "예정", active: "진행 중", done: "완료", error: "오류" };
export function ProgressTracker({
  steps,
  orientation = "vertical",
  onAdvance,
  toolName: name,
  webmcp,
  className = "",
  ...props
}: ProgressTrackerProps) {
  const id = useId();
  const { reduced, entrance } = useAingMotion();
  const label = props["aria-label"] ?? "작업 진행 상황";
  const [error, setError] = useState("");
  const base = toolName("progress", id, { toolName: name, webmcp }, "", label);
  const percent = steps.length
    ? Math.round(
        (steps.filter((s) => s.status === "done").length / steps.length) * 100,
      )
    : 0;
  const count = useMotionValue(percent);
  const rounded = useTransform(count, value => `${Math.round(value)}% COMPLETE`);
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => { const controls = animate(count, percent, reduced || keyboard ? {duration:0} : easeOut); return () => controls.stop(); }, [count, percent, reduced, keyboard]);
  useWebMCPTool(
    webmcp === false
      ? null
      : {
          name: `${base}_get_status`,
          description:
            webmcp?.description ?? `단계별 상태와 완료율을 읽습니다. · ${label}`,
          inputSchema: { type: "object", properties: {} },
          annotations: { readOnlyHint: true },
          execute: () => result({ steps, percent }),
        },
  );
  useWebMCPTool(
    webmcp === false || !onAdvance
      ? null
      : {
          name: `${base}_advance`,
          description: `다음 단계로 진행합니다. · ${label}`,
          inputSchema: { type: "object", properties: {} },
          annotations: { consequentialHint: true },
          async execute() {
            if (!steps.some((s) => s.status !== "done"))
              throw new Error("모든 단계가 완료되었습니다.");
            await onAdvance();
            return result({ advanced: true });
          },
        },
  );
  return (
    <motion.div {...entrance}><div {...props} className={`w-full max-w-[460px] rounded-xl border bg-card p-5 text-card-foreground shadow-xs ${className}`}>
      <div className="mb-5 flex items-center justify-between text-xs"><span className="font-medium">작업 진행 상황</span><span className="font-mono text-[10px] text-muted-foreground"><motion.span>{rounded}</motion.span></span></div>
      <div role="progressbar" aria-label="전체 진행률" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="mb-6 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full origin-left rounded-full bg-primary" initial={false} animate={{ scaleX: percent / 100 }} transition={{ duration: reduced ? 0 : 0.25, ease: "easeOut" }} />
      </div>
      <ol className={orientation === "horizontal" ? "flex gap-3" : "space-y-0"}>
        {steps.map((s, i) => <li key={s.id} aria-current={s.status === "active" ? "step" : undefined} className={`relative min-w-0 ${orientation === "horizontal" ? "flex-1 pb-3" : "flex gap-3 pb-6 last:pb-0"}`}>
          {i < steps.length - 1 && <span aria-hidden className={`absolute bg-border ${orientation === "horizontal" ? "top-3 left-6 h-px w-[calc(100%-12px)]" : "top-6 bottom-0 left-3 w-px"}`}><motion.span className="absolute inset-0 origin-top-left bg-primary" initial={false} animate={orientation === "horizontal" ? { scaleX: s.status === "done" ? 1 : 0 } : { scaleY: s.status === "done" ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.25 }} /></span>}
          <span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[10px] ${s.status === "done" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
            <motion.span aria-hidden className="absolute inset-0 grid place-items-center" initial={false} animate={{ scale: s.status === "done" ? 1 : 0.5, opacity: s.status === "done" ? 1 : 0 }} transition={reduced || keyboard ? {duration:0} : spring}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><motion.path d="m5 12 4 4L19 6" initial={false} animate={{pathLength:s.status === "done" ? 1 : 0}} transition={reduced || keyboard ? {duration:0} : easeOut} /></svg></motion.span>
            {s.status === "done" ? null : s.status === "active" ? <motion.span className="size-2 rounded-full bg-[#33cc33]" animate={{ opacity: reduced ? 1 : [1, 0.4, 1], scale: reduced ? 1 : [1, 0.8, 1] }} transition={{ duration: reduced ? 0 : 1.8, repeat: reduced ? 0 : Infinity }} /> : s.status === "error" ? <X aria-hidden size={12} /> : i + 1}
          </span>
          <div className={orientation === "horizontal" ? "mt-2.5" : "pt-0.5"}><p className="break-words text-xs font-medium">{s.label}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{s.meta ?? `STEP 0${i + 1}`} · {labels[s.status]}</p></div>
        </li>)}
      </ol>
      {onAdvance && (
        <button
          type="button"
          disabled={!steps.some((s) => s.status !== "done")}
          onPointerDown={() => {setKeyboard(false);}} onKeyDown={() => {setKeyboard(true);}}
          onClick={async () => {
            setError("");
            try {
              await onAdvance();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "단계 진행에 실패했습니다.",
              );
            }
          }}
          className="mt-5 flex items-center gap-2 rounded-md border px-3 py-2 text-xs hover:bg-muted disabled:opacity-50"
        >
          다음 단계 <ArrowRight aria-hidden size={13} />
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </div></motion.div>
  );
}
