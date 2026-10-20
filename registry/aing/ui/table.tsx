"use client";
import { Children, isValidElement, useId, useRef, useImperativeHandle, type ComponentProps } from "react";
import { motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { accessibleText, result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";
export function Table({ className = "", webmcp, toolName: name, ...props }: ComponentProps<"table"> & WebMCPProps) {
  const id = useId(), ref = useRef<HTMLTableElement>(null);
  const label = props["aria-label"] ?? (accessibleText(Children.toArray(props.children).find(child => isValidElement(child) && child.type === TableCaption)) || "table");
  useImperativeHandle(props.ref, () => ref.current!);
  useWebMCPTool(webmcp === false ? null : { name: toolName("read_table", id, { webmcp, toolName: name }, "", label), description: webmcp?.description ?? `${label}의 현재 화면 데이터 읽기`, inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => result({ caption: ref.current?.caption?.textContent?.trim(), rows: Array.from(ref.current?.rows ?? []).filter(row => !row.hidden && !row.closest("[hidden], [aria-hidden=true]")).map(row => Array.from(row.cells, cell => cell.innerText ?? cell.textContent?.trim())) }) });
  return <div className="relative w-full overflow-x-auto rounded-lg border"><table {...props} ref={ref} className={`w-full caption-bottom text-[13px] ${className}`} /></div>;
}
export function TableHeader({ className = "", ...props }: ComponentProps<"thead">) { return <thead {...props} className={`bg-muted/50 [&_tr]:border-b ${className}`} />; }
export function TableBody({ className = "", ...props }: ComponentProps<"tbody">) { return <tbody {...props} className={`[&_tr:last-child]:border-0 ${className}`} />; }
export function TableFooter({ className = "", ...props }: ComponentProps<"tfoot">) { return <tfoot {...props} className={`border-t bg-muted/50 font-medium ${className}`} />; }
export function TableRow({ className = "", ...props }: ComponentProps<"tr">) { return <tr {...props} className={`border-b motion-safe:transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} />; }
export function TableHead({ className = "", ...props }: ComponentProps<"th">) { return <th scope="col" {...props} className={`h-10 px-3 text-left align-middle font-medium text-muted-foreground ${className}`} />; }
export function TableCell({ children, className = "", ...props }: ComponentProps<"td">) {
  const { entrance, transition, reduced } = useAingMotion();
  return <td {...props} className={`p-3 align-middle ${className}`}><motion.div {...entrance} whileHover={reduced ? undefined : { x: 2 }} transition={transition}>{children}</motion.div></td>;
}
export function TableCaption({ className = "", ...props }: ComponentProps<"caption">) { return <caption {...props} className={`border-t px-3 py-3 text-left text-[12px] text-muted-foreground ${className}`} />; }
