"use client";
import { useId, type ComponentProps } from "react";
import { Progress as Primitive } from "radix-ui";
import { motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
export function Progress({ value = null, max = 100, className = "", webmcp, toolName: name, ...props }: ComponentProps<typeof Primitive.Root> & WebMCPProps) {
  const id = useId(), { transition, reduced } = useAingMotion();
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const current = typeof value === "number" && Number.isFinite(value) ? Math.min(limit, Math.max(0, value)) : null;
  useWebMCPTool(webmcp === false ? null : { name: toolName("read_progress", id, { webmcp, toolName: name }, "", props["aria-label"] ?? "progress"), description: webmcp?.description ?? `${props["aria-label"] ?? "진행률"} 읽기`, inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => result({ value: current, max: limit, indeterminate: current === null }) });
  return <Primitive.Root {...props} value={current} max={limit} className={`relative h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}><Primitive.Indicator asChild><motion.div className="size-full origin-left rounded-full bg-primary" initial={{ scaleX: current === null ? 0.3 : current / limit, x: current === null ? "35%" : 0, opacity: 1 }} animate={current === null ? { scaleX: 0.3, x: reduced ? "35%" : ["-30%", "100%"], opacity: reduced ? 1 : [0.4, 1, 0.4] } : { scaleX: current / limit, x: 0, opacity: 1 }} transition={current === null && !reduced ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : transition} /></Primitive.Indicator></Primitive.Root>;
}
