"use client";
import { createContext, useContext, useId, type ComponentProps } from "react";
import { Slot } from "radix-ui";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
const Context = createContext({ id: "", page: undefined as number | undefined, change: undefined as ((page: number) => void) | undefined, count: 1 });
export function Pagination({ page, pageCount = 1, onPageChange, className = "", webmcp, toolName: name, ...props }: ComponentProps<"nav"> & WebMCPProps & { page?: number; pageCount?: number; onPageChange?: (page: number) => void }) {
  const id = useId(), count = Number.isSafeInteger(pageCount) && pageCount > 0 ? pageCount : 1;
  useWebMCPTool(webmcp === false || !onPageChange ? null : { name: toolName("go_to_page", id, { webmcp, toolName: name }, "", props["aria-label"] ?? "pagination"), description: webmcp?.description ?? `${props["aria-label"] ?? "목록"} 페이지 이동`, inputSchema: { type: "object", properties: { page: { type: "integer", minimum: 1, maximum: count } }, required: ["page"], additionalProperties: false }, execute: input => { if (typeof input.page !== "number" || !Number.isSafeInteger(input.page) || input.page < 1 || input.page > count) throw new Error("페이지 범위를 벗어났습니다."); onPageChange(input.page); return result({ page: input.page }); } });
  return <Context.Provider value={{ id, page, change: onPageChange, count }}><nav role="navigation" aria-label="pagination" {...props} className={`mx-auto flex w-full justify-center ${className}`} /></Context.Provider>;
}
export function PaginationContent({ className = "", ...props }: ComponentProps<"ul">) { return <ul {...props} className={`flex flex-wrap items-center gap-1 ${className}`} />; }
export function PaginationItem({ className = "", ...props }: ComponentProps<"li">) { return <li {...props} className={`inline-flex ${className}`} />; }
export function PaginationLink({ isActive, page, size = "icon", asChild, className = "", onClick, children, ...props }: ComponentProps<"a"> & { isActive?: boolean; page?: number; size?: "default" | "sm" | "lg" | "icon"; asChild?: boolean }) {
  const context = useContext(Context), { transition, reduced } = useAingMotion();
  const active = isActive ?? (page !== undefined && page === context.page);
  const disabled = props["aria-disabled"] === true || props["aria-disabled"] === "true" || (page !== undefined && (page < 1 || page > context.count));
  const Component = asChild ? Slot.Root : "a";
  return <Component {...props} aria-current={active ? "page" : undefined} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : props.tabIndex} onClick={event => { if (disabled) { event.preventDefault(); return; } onClick?.(event); if (!event.defaultPrevented && page !== undefined && context.change && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); context.change(page); } }} className={`relative isolate inline-flex h-9 items-center justify-center gap-1 rounded-md text-[13px] outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-disabled:pointer-events-none aria-disabled:opacity-40 ${size === "icon" ? "w-9" : size === "sm" ? "px-2" : size === "lg" ? "px-4" : "px-3"} ${className}`}>
    {active && <motion.span layoutId={`${context.id}-page`} transition={transition} className="absolute inset-0 -z-10 rounded-md border bg-card shadow-xs" />}{asChild ? <Slot.Slottable>{children}</Slot.Slottable> : <motion.span className="inline-flex items-center gap-1" whileHover={reduced || disabled ? undefined : { y: -1 }} transition={transition}>{children}</motion.span>}
  </Component>;
}
export function PaginationPrevious({ className = "", ...props }: ComponentProps<typeof PaginationLink>) { return <PaginationLink aria-label="Previous page" size="default" {...props} className={className}><ChevronLeft aria-hidden size={14} /><span className="hidden sm:inline">Previous</span></PaginationLink>; }
export function PaginationNext({ className = "", ...props }: ComponentProps<typeof PaginationLink>) { return <PaginationLink aria-label="Next page" size="default" {...props} className={className}><span className="hidden sm:inline">Next</span><ChevronRight aria-hidden size={14} /></PaginationLink>; }
export function PaginationEllipsis({ className = "", ...props }: ComponentProps<"span">) { return <span {...props} className={`flex size-9 items-center justify-center ${className}`}><MoreHorizontal aria-hidden size={15} /><span className="sr-only">More pages</span></span>; }
