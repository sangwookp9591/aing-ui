"use client";
import { useId, type ReactNode } from "react";
import { Slot } from "radix-ui";
import { motion, type HTMLMotionProps } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { accessibleText, result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
const MotionSlot = motion.create(Slot.Root);
export function badgeVariants({ variant = "default", className = "" }: { variant?: "default" | "secondary" | "destructive" | "outline"; className?: string } = {}) {
  return `inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 ${ { default: "border-transparent bg-primary text-primary-foreground", secondary: "border-transparent bg-secondary text-secondary-foreground", destructive: "border-transparent bg-destructive text-destructive-foreground", outline: "border-border bg-background text-foreground" }[variant]} ${className}`;
}
export function Badge({ children, variant = "default", className, asChild, webmcp, toolName: name, ...props }: Omit<HTMLMotionProps<"span">, "children"> & { children?: ReactNode } & WebMCPProps & { asChild?: boolean; variant?: "default" | "secondary" | "destructive" | "outline" }) {
  const id = useId(), label = props["aria-label"] ?? accessibleText(children);
  const { entrance, transition, reduced } = useAingMotion();
  useWebMCPTool(webmcp === false ? null : { name: toolName("read_badge", id, { webmcp, toolName: name }, "", label), description: webmcp?.description ?? `${label} 배지 읽기`, inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => result({ label, variant }) });
  const Component = asChild ? MotionSlot : motion.span;
  return <Component {...entrance} whileHover={reduced ? undefined : { y: -1, scale: 1.03 }} transition={transition} {...props} className={badgeVariants({ variant, className })}>{children}</Component>;
}
