"use client";

import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { Accordion as Primitive } from "radix-ui";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useAingMotion } from "../lib/motion";
import { accessibleText, result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";

const RootContext = createContext<{ values: string[]; toggle: (value: string) => boolean; disabled: boolean; webmcp: WebMCPProps["webmcp"]; toolName?: string }>({ values: [], toggle: () => false, disabled: false, webmcp: undefined });
const ItemContext = createContext({ value: "", disabled: false });
export function Accordion({ children, ...props }: ComponentProps<typeof Primitive.Root> & WebMCPProps) {
  const { webmcp, toolName: name, ...radix } = props;
  const [local, setLocal] = useState<string | string[]>(radix.defaultValue ?? (radix.type === "multiple" ? [] : ""));
  const value = radix.value ?? local;
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const change = (next: string | string[]) => {
    if (radix.value === undefined) setLocal(next);
    if (radix.type === "multiple") radix.onValueChange?.(next as string[]); else radix.onValueChange?.(next as string);
  };
  const toggle = (item: string) => {
    const next = radix.type === "multiple" ? values.includes(item) ? values.filter(v => v !== item) : [...values, item] : values.includes(item) && radix.collapsible ? "" : item;
    change(next);
    return Array.isArray(next) ? next.includes(item) : next === item;
  };
  const shared = { values, toggle, disabled: radix.disabled ?? false, webmcp, toolName: name };
  return <RootContext.Provider value={shared}>{radix.type === "multiple" ? <Primitive.Root {...radix} value={values} onValueChange={change}>{children}</Primitive.Root> : <Primitive.Root {...radix} value={values[0] ?? ""} onValueChange={change}>{children}</Primitive.Root>}</RootContext.Provider>;
}
export function AccordionItem({ value, disabled = false, className = "", ...props }: ComponentProps<typeof Primitive.Item>) {
  return <ItemContext.Provider value={{ value, disabled }}><Primitive.Item {...props} value={value} disabled={disabled} className={`border-b last:border-b-0 ${className}`} /></ItemContext.Provider>;
}
export function AccordionTrigger({ children, className = "", ...props }: ComponentProps<typeof Primitive.Trigger>) {
  const root = useContext(RootContext), item = useContext(ItemContext), id = useId();
  const { transition, reduced } = useAingMotion();
  const label = accessibleText(children);
  const open = root.values.includes(item.value);
  useWebMCPTool(root.webmcp === false ? null : {
    name: toolName("toggle", id, { webmcp: root.webmcp, toolName: root.toolName }, `_${item.value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)}`, label),
    description: root.webmcp?.description ?? `${label} 펼치기 또는 접기`, inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: () => { if (root.disabled || item.disabled || props.disabled) throw new Error("비활성 항목입니다."); const nextOpen = root.toggle(item.value); return result({ value: item.value, open: nextOpen }); },
  });
  return <Primitive.Header className="flex"><Primitive.Trigger {...props} className={`flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-[14px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50 ${className}`}>
    <motion.span whileHover={reduced ? undefined : { x: 2 }} transition={transition}>{children}</motion.span><motion.span aria-hidden animate={{ rotate: open ? 180 : 0 }} transition={transition}><ChevronDown size={15} className="text-muted-foreground" /></motion.span>
  </Primitive.Trigger></Primitive.Header>;
}
export function AccordionContent({ children, className = "", ...props }: ComponentProps<typeof Primitive.Content>) {
  const root = useContext(RootContext), item = useContext(ItemContext);
  const open = root.values.includes(item.value);
  const { transition } = useAingMotion();
  return <Primitive.Content {...props} forceMount asChild><motion.div inert={!open} aria-hidden={!open} initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={transition} className="overflow-hidden"><div className={`pb-4 text-[13px] leading-6 text-muted-foreground ${className}`}>{children}</div></motion.div></Primitive.Content>;
}
