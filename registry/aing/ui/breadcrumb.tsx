"use client";
import { useId, useRef, useImperativeHandle, type ComponentProps } from "react";
import { Slot } from "radix-ui";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
export function Breadcrumb({ className = "", webmcp, toolName: name, ...props }: ComponentProps<"nav"> & WebMCPProps) {
  const id = useId(), ref = useRef<HTMLElement>(null);
  useImperativeHandle(props.ref, () => ref.current!);
  useWebMCPTool(webmcp === false ? null : { name: toolName("read_breadcrumb", id, { webmcp, toolName: name }, "", props["aria-label"] ?? "path"), description: webmcp?.description ?? "현재 경로와 링크 읽기 (이동하지 않음)", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => result({ path: Array.from(ref.current?.querySelectorAll("a, [aria-current=page]") ?? [], el => ({ label: el.textContent?.trim(), href: el.getAttribute("href"), current: el.getAttribute("aria-current") === "page" })) }) });
  return <nav aria-label="breadcrumb" {...props} ref={ref} className={className} />;
}
export function BreadcrumbList({ className = "", ...props }: ComponentProps<"ol">) { return <ol {...props} className={`flex flex-wrap items-center gap-1.5 break-words text-[13px] text-muted-foreground ${className}`} />; }
export function BreadcrumbItem({ children, className = "", ...props }: ComponentProps<"li">) {
  const { entrance } = useAingMotion();
  return <li {...props} className={`inline-flex items-center gap-1.5 ${className}`}><motion.span {...entrance} className="inline-flex items-center gap-1.5">{children}</motion.span></li>;
}
export function BreadcrumbLink({ asChild, className = "", ...props }: ComponentProps<"a"> & { asChild?: boolean }) { const Component = asChild ? Slot.Root : "a"; return <Component {...props} className={`rounded-sm outline-none motion-safe:transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 ${className}`} />; }
export function BreadcrumbPage({ className = "", ...props }: ComponentProps<"span">) { return <span role="link" aria-disabled="true" aria-current="page" {...props} className={`font-medium text-foreground ${className}`} />; }
export function BreadcrumbSeparator({ children, className = "", ...props }: ComponentProps<"li">) {
  const { transition } = useAingMotion();
  return <li role="presentation" aria-hidden="true" {...props} className={className}><motion.span className="inline-flex" initial={{ x: -3, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={transition}>{children ?? <ChevronRight size={13} />}</motion.span></li>;
}
export function BreadcrumbEllipsis({ className = "", ...props }: ComponentProps<"span">) { return <span {...props} className={`flex size-7 items-center justify-center ${className}`}><MoreHorizontal aria-hidden size={15} /><span className="sr-only">More</span></span>; }
