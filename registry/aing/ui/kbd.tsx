"use client";
import { useId, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { accessibleText, result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
export function Kbd({ children, className = "", webmcp, toolName: name, ...props }: Omit<HTMLMotionProps<"kbd">, "children"> & { children?: ReactNode } & WebMCPProps) {
  const id = useId(), label = props["aria-label"] ?? accessibleText(children);
  const { entrance, transition, reduced } = useAingMotion();
  useWebMCPTool(webmcp === false ? null : { name: toolName("read_shortcut", id, { webmcp, toolName: name }, "", label), description: webmcp?.description ?? `${label} 단축키 읽기 (키 입력을 실행하지 않음)`, inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => result({ shortcut: label }) });
  return <motion.kbd {...entrance} whileHover={reduced ? undefined : { y: -2, scale: 1.05 }} transition={transition} {...props} className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-b-2 bg-muted px-1.5 font-mono text-[11px] text-muted-foreground ${className}`}>{children}</motion.kbd>;
}
export function KbdGroup({ className = "", ...props }: HTMLMotionProps<"span">) { return <motion.span {...props} className={`inline-flex items-center gap-1 ${className}`} />; }
