"use client";
import { useId, type ComponentProps } from "react";
import { Avatar as Primitive } from "radix-ui";
import { motion, type HTMLMotionProps } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { accessibleText, result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
export function Avatar({ children, className = "", webmcp, toolName: name, ...props }: ComponentProps<typeof Primitive.Root> & WebMCPProps) {
  const id = useId(), label = props["aria-label"] ?? accessibleText(children);
  const { entrance, transition, reduced } = useAingMotion();
  useWebMCPTool(webmcp === false ? null : { name: toolName("read_avatar", id, { webmcp, toolName: name }, "", label), description: webmcp?.description ?? `${label} 프로필 읽기`, inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => result({ label }) });
  return <Primitive.Root {...props} asChild><motion.span {...entrance} whileHover={reduced ? undefined : { y: -4, scale: 1.08, zIndex: 10 }} transition={transition} className={`relative inline-flex size-10 shrink-0 overflow-hidden rounded-full border bg-muted text-foreground ring-2 ring-background ${className}`}>{children}</motion.span></Primitive.Root>;
}
export function AvatarImage({ className = "", ...props }: ComponentProps<typeof Primitive.Image>) {
  const { transition } = useAingMotion();
  return <Primitive.Image {...props} asChild><motion.img initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={transition} className={`aspect-square size-full object-cover ${className}`} /></Primitive.Image>;
}
export function AvatarFallback({ className = "", ...props }: ComponentProps<typeof Primitive.Fallback>) {
  return <Primitive.Fallback {...props} className={`flex size-full items-center justify-center rounded-full bg-muted text-[13px] font-medium ${className}`} />;
}
export function AvatarGroup({ className = "", ...props }: HTMLMotionProps<"div">) {
  const { transition, reduced } = useAingMotion();
  return <motion.div {...props} initial={{ gap: "0px" }} animate={{ gap: "0px" }} whileHover={reduced ? undefined : { gap: "12px" }} transition={transition} className={`flex items-center -space-x-2 ${className}`} />;
}
