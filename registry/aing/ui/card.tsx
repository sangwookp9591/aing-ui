"use client";
import { spring,useAingMotion } from "@/registry/aing/lib/motion";
import {
accessibleText,
result,
toolName,
useWebMCPTool,
type WebMCPProps,
} from "@/registry/aing/lib/webmcp";
import { motion,useMotionTemplate,useSpring } from "motion/react";
import { useId,useRef,useState,type ComponentProps } from "react";
export type CardProps = ComponentProps<"section"> &
  WebMCPProps & {
    spotlight?: boolean;
    actions?: {
      id: string;
      label: string;
      onSelect: () => void | Promise<void>;
    }[];
  };
export function Card({
  actions,
  spotlight = false,
  onPointerMove,
  onPointerLeave,
  toolName: name,
  webmcp,
  className = "",
  children,
  ref,
  ...props
}: CardProps) {
  const id = useId();
  const { reduced, entrance } = useAingMotion();
  const label = props["aria-label"] ?? accessibleText(children);
  const cursorX = useSpring(0, spring), cursorY = useSpring(0, spring);
  const borderHighlight = useMotionTemplate`radial-gradient(180px circle at ${cursorX}px ${cursorY}px, var(--ring), transparent)`;
  const highlight = useMotionTemplate`radial-gradient(240px circle at ${cursorX}px ${cursorY}px, color-mix(in srgb, var(--foreground) 6%, transparent), transparent)`;
  const [error, setError] = useState("");
  const element = useRef<HTMLElement | null>(null);
  useWebMCPTool(
    webmcp === false
      ? null
      : {
          name: toolName(
            "card",
            id,
            { toolName: name, webmcp },
            actions?.length ? "_action" : "_read",
            label,
          ),
          description:
            webmcp?.description ??
            (actions?.length
              ? `카드의 작업을 실행합니다. · ${label}`
              : `카드의 제목과 설명을 읽습니다. · ${label}`),
          inputSchema: {
            type: "object",
            properties: actions?.length
              ? { action: { type: "string", enum: actions.map((a) => a.id) } }
              : {},
            required: actions?.length ? ["action"] : [],
          },
          annotations: actions?.length
            ? { consequentialHint: true }
            : { readOnlyHint: true, untrustedContentHint: true },
          async execute({ action }) {
            if (actions?.length) {
              const selected = actions.find((a) => a.id === action);
              if (!selected) throw new Error("지원하지 않는 카드 작업입니다.");
              await selected.onSelect();
              return result({ selected: selected.id });
            }
            return result({
              title:
                element.current?.querySelector("[data-card-title]")
                  ?.textContent ?? "",
              description:
                element.current?.querySelector("[data-card-description]")
                  ?.textContent ?? "",
            });
          },
        },
  );
  return (
    <motion.div {...entrance}><section
      {...props}
      ref={(node) => {
        element.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (!spotlight || reduced || e.pointerType === "touch") return;
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left, y = e.clientY - box.top;
        cursorX.set(x); cursorY.set(y);
        e.currentTarget.style.borderColor = "var(--ring)";
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        if (!spotlight) return;
        e.currentTarget.style.backgroundImage = props.style?.backgroundImage ?? "";
        e.currentTarget.style.borderColor = props.style?.borderColor ?? "";
      }}
      className={`group/card relative isolate overflow-hidden min-w-0 rounded-xl border bg-card text-card-foreground shadow-xs ${className}`}
    >
      {spotlight && <motion.div aria-hidden style={{backgroundImage:highlight}} className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 motion-safe:group-hover/card:opacity-100" />}
      {spotlight && <motion.div aria-hidden style={{backgroundImage:borderHighlight, borderRadius:"inherit"}} className="pointer-events-none absolute inset-0 p-px opacity-0 transition-opacity duration-200 motion-safe:group-hover/card:opacity-100 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude]" />}
      {children}
      {!!actions?.length && (
        <CardFooter>
          {actions.map((a) => (
            <button
              className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground hover:opacity-90"
              key={a.id}
              type="button"
              onClick={async () => {
                setError("");
                try {
                  await a.onSelect();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "카드 작업에 실패했습니다.",
                  );
                }
              }}
            >
              {a.label}
            </button>
          ))}
        </CardFooter>
      )}
      {error && (
        <p role="alert" className="px-5 pb-5 text-sm">
          {error}
        </p>
      )}
    </section></motion.div>
  );
}
export function CardHeader({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return <div {...props} className={`space-y-2 p-5 pb-3 ${className}`} />;
}
export function CardTitle({ className = "", ...props }: ComponentProps<"h3">) {
  return (
    <h3
      {...props}
      data-card-title
      className={`text-base font-semibold tracking-tight ${className}`}
    />
  );
}
export function CardDescription({
  className = "",
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      {...props}
      data-card-description
      className={`text-sm leading-6 text-muted-foreground ${className}`}
    />
  );
}
export function CardContent({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return <div {...props} className={`p-5 pt-3 ${className}`} />;
}
export function CardFooter({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div {...props} className={`flex flex-wrap gap-2 p-5 pt-3 ${className}`} />
  );
}
