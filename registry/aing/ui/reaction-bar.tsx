"use client";
import { easeOut,spring,useAingMotion } from "@/registry/aing/lib/motion";
import {
result,
toolName,
useWebMCPTool,
type WebMCPProps,
} from "@/registry/aing/lib/webmcp";
import { Plus } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import { useId,useState,type ComponentProps } from "react";
export type Reaction = { emoji: string; count: number; active: boolean };
export type ReactionBarProps = Omit<ComponentProps<"div">, "onToggle"> &
  WebMCPProps & {
    reactions: Reaction[];
    onAdd?: (emoji: string) => void | Promise<void>;
    onToggle: (emoji: string) => void | Promise<void>;
  };
export function ReactionBar({
  reactions,
  onToggle,
  onAdd,
  toolName: name,
  webmcp,
  className = "",
  ...props
}: ReactionBarProps) {
  const id = useId();
  const { reduced, transition, entrance } = useAingMotion();
  const label = props["aria-label"] ?? "메시지 반응";
  const [pointer, setPointer] = useState(false);
  const [error, setError] = useState("");
  const base = toolName("reaction", id, { toolName: name, webmcp }, "", label);
  useWebMCPTool(
    webmcp === false
      ? null
      : {
          name: `${base}_toggle`,
          description: webmcp?.description ?? `이모지 반응을 켜거나 끕니다. · ${label}`,
          inputSchema: {
            type: "object",
            properties: {
              emoji: { type: "string", enum: reactions.map((r) => r.emoji) },
            },
            required: ["emoji"],
          },
          annotations: { consequentialHint: true },
          async execute({ emoji }) {
            if (
              typeof emoji !== "string" ||
              !reactions.some((r) => r.emoji === emoji)
            )
              throw new Error("지원하지 않는 이모지입니다.");
            await onToggle(emoji);
            return result({ toggled: emoji });
          },
        },
  );
  useWebMCPTool(
    webmcp === false
      ? null
      : {
          name: `${base}_list`,
          description: `현재 반응과 개수를 읽습니다. · ${label}`,
          inputSchema: { type: "object", properties: {} },
          annotations: { readOnlyHint: true },
          execute: () => result(reactions),
        },
  );
  return (
    <motion.div {...entrance}><div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "메시지 반응"}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          aria-pressed={r.active}
          aria-label={`${r.emoji} 반응 ${r.count}개`}
          onPointerDown={() => setPointer(true)}
          onKeyDown={() => setPointer(false)}
          onClick={async () => {
            setError("");
            try {
              await onToggle(r.emoji);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "반응 변경에 실패했습니다.",
              );
            }
          }}
          className="relative flex min-h-9 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-card-foreground aria-pressed:border-ring aria-pressed:bg-muted"
        >
          {r.active && pointer && !reduced && [0,1,2].map(i => <motion.span key={`${r.emoji}-particle-${i}`} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-1 rounded-full bg-foreground/40" initial={{opacity:0.8, x:0,y:0}} animate={{opacity:0,x:(i-1)*18,y:-22-i*4,scale:0}} transition={{...easeOut, duration:0.4}} />)}
          <motion.span key={`${r.emoji}-${r.active}`} initial={reduced || !pointer ? false : { y: 0, scale: 0.85 }} animate={{ y: 0, scale: 1 }} transition={reduced || !pointer ? {duration:0} : spring}>{r.emoji}</motion.span>
          <span className="relative inline-flex h-4 min-w-3 items-center overflow-hidden font-mono text-[11px]"><AnimatePresence initial={false} mode="popLayout"><motion.span key={r.count} initial={reduced || !pointer ? false : { y: r.active ? 12 : -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduced || !pointer ? 0 : r.active ? -12 : 12, opacity: 0 }} transition={{ duration: reduced || !pointer ? 0 : 0.16 }}>{r.count}</motion.span></AnimatePresence></span>
        </button>
      ))}
      {onAdd && <details className="relative" onKeyDown={(e) => { if (e.key === "Escape") { e.currentTarget.open = false; e.currentTarget.querySelector("summary")?.focus(); } }}>
        <summary aria-label="반응 추가" className="grid size-9 list-none place-items-center rounded-full border bg-card text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden"><Plus aria-hidden size={14} /></summary>
        <motion.div initial={{opacity:0,scale:0.92}} whileInView={{opacity:1,scale:1}} transition={transition} style={{transformOrigin:"bottom right"}} role="group" aria-label="이모지 선택" className="absolute right-0 bottom-11 z-20 flex gap-1 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-sm">
          {["🔥", "🎉", "👀", "❤️"].filter((emoji) => !reactions.some((r) => r.emoji === emoji)).map((emoji) => <button type="button" key={emoji} aria-label={`${emoji} 추가`} className="grid size-9 place-items-center rounded-md hover:bg-muted" onClick={async (e) => {
            const popover = e.currentTarget.closest("details");
            setError("");
            try { await onAdd(emoji); if (popover) { popover.open = false; popover.querySelector("summary")?.focus(); } }
            catch (err) { setError(err instanceof Error ? err.message : "반응 추가에 실패했습니다."); }
          }}>{emoji}</button>)}
          {["🔥", "🎉", "👀", "❤️"].every((emoji) => reactions.some((r) => r.emoji === emoji)) && <p className="p-2 text-xs whitespace-nowrap">모든 반응을 추가했어요.</p>}
        </motion.div>
      </details>}
      {error && (
        <p role="alert" className="w-full text-sm">
          {error}
        </p>
      )}
    </div></motion.div>
  );
}
