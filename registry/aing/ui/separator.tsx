"use client";
import { useId, type ComponentProps } from "react";
import { Separator as Primitive } from "radix-ui";
import { motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
export function Separator({ orientation = "horizontal", decorative = true, className = "", webmcp, toolName: name, ...props }: ComponentProps<typeof Primitive.Root> & WebMCPProps) {
  const id = useId(), { transition } = useAingMotion();
  useWebMCPTool(webmcp === false || decorative ? null : { name: toolName("read_separator", id, { webmcp, toolName: name }, "", props["aria-label"] ?? "section"), description: webmcp?.description ?? "구역 구분선 읽기", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => result({ orientation, label: props["aria-label"] }) });
  return <Primitive.Root {...props} orientation={orientation} decorative={decorative} asChild><motion.div initial={{ opacity: 0, scaleX: orientation === "horizontal" ? 0.6 : 1, scaleY: orientation === "vertical" ? 0.6 : 1 }} animate={{ opacity: 1, scaleX: 1, scaleY: 1 }} transition={transition} className={`shrink-0 origin-left bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px ${className}`} /></Primitive.Root>;
}
