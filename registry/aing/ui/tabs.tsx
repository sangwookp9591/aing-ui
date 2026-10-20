"use client";

import { Children, createContext, isValidElement, useContext, useId, useState, type ComponentProps, type ReactNode } from "react";
import { Tabs as Primitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { accessibleText, result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";

const Context = createContext({ value: "", id: "" });
function options(children: ReactNode): { value: string; label: string; disabled?: boolean }[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) return [];
    return child.type === TabsTrigger ? [{ value: child.props.value!, label: accessibleText(child.props.children), disabled: child.props.disabled }] : options(child.props.children);
  });
}
export function Tabs({ value: controlled, defaultValue = "", onValueChange, children, className = "", webmcp, toolName: name, ...props }: ComponentProps<typeof Primitive.Root> & WebMCPProps) {
  const id = useId();
  const [local, setLocal] = useState(defaultValue);
  const value = controlled ?? local;
  const items = options(children).filter(item => !item.disabled);
  const select = (next: string) => { if (controlled === undefined) setLocal(next); onValueChange?.(next); };
  useWebMCPTool(webmcp === false ? null : {
    name: toolName("select", id, { webmcp, toolName: name }, "", props["aria-label"] ?? "tabs"),
    description: webmcp?.description ?? `${props["aria-label"] ?? "탭"} 선택: ${items.map(item => item.label).join(", ")}`,
    inputSchema: { type: "object", properties: { value: { type: "string", enum: items.map(item => item.value) } }, required: ["value"], additionalProperties: false },
    execute: input => { if (typeof input.value !== "string" || !items.some(item => item.value === input.value)) throw new Error("선택 가능한 탭이 아닙니다."); select(input.value); return result({ value: input.value }); },
  });
  return <Context.Provider value={{ value, id }}><Primitive.Root {...props} value={value} onValueChange={select} className={`w-full ${className}`}>{children}</Primitive.Root></Context.Provider>;
}
export function TabsList({ className = "", ...props }: ComponentProps<typeof Primitive.List>) {
  return <Primitive.List {...props} className={`inline-flex max-w-full items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground data-[orientation=vertical]:flex-col ${className}`} />;
}
export function TabsTrigger({ children, value, className = "", ...props }: ComponentProps<typeof Primitive.Trigger>) {
  const context = useContext(Context);
  const { transition, reduced } = useAingMotion();
  return <Primitive.Trigger {...props} value={value} asChild><motion.button whileTap={reduced ? undefined : { scale: 0.97 }} transition={transition} className={`relative isolate rounded-md px-3 py-1.5 text-[13px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 data-[state=active]:text-foreground disabled:pointer-events-none disabled:opacity-50 ${className}`}>
    {context.value === value && <motion.span layoutId={`${context.id}-tab`} transition={transition} className="absolute inset-0 -z-10 rounded-md border border-border/60 bg-background shadow-xs" />}{children}
  </motion.button></Primitive.Trigger>;
}
export function TabsContent({ children, value, className = "", ...props }: ComponentProps<typeof Primitive.Content>) {
  const { value: selected } = useContext(Context);
  const { transition, reduced } = useAingMotion();
  return <AnimatePresence mode="wait">{selected === value && <Primitive.Content {...props} value={value} forceMount asChild><motion.div key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -2, transition: { duration: reduced ? 0 : 0.1 } }} transition={transition} className={`mt-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 rounded-md ${className}`}>{children}</motion.div></Primitive.Content>}</AnimatePresence>;
}
