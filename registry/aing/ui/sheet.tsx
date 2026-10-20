"use client";
import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { Dialog as Primitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { useAingMotion, easeOut } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";

const State = createContext({open: false});
export type SheetProps = ComponentProps<typeof Primitive.Root> & WebMCPProps & { label?: string };
export function Sheet({open: controlled, defaultOpen = false, onOpenChange, label = "Sheet", webmcp, toolName: name, ...props}: SheetProps) {
 const [local, setLocal] = useState(defaultOpen);
 const open = controlled ?? local;
 const id = useId();
 const change = (next: boolean) => {setLocal(next); onOpenChange?.(next);};
 const options = {webmcp, toolName: name};
 useWebMCPTool(webmcp === false ? null : { name: toolName("open", id, options, name || (webmcp && webmcp.name) ? "_open" : "", label), description: `${webmcp && webmcp.description || label}: open`, inputSchema: {type:"object", properties:{}, additionalProperties:false}, execute: () => {change(true); return result({open:true});} });
 useWebMCPTool(webmcp === false ? null : { name: toolName("close", id, options, name || (webmcp && webmcp.name) ? "_close" : "", label), description: `${webmcp && webmcp.description || label}: close`, inputSchema: {type:"object", properties:{}, additionalProperties:false}, execute: () => {change(false); return result({open:false});} });
 return <State value={{open}}><Primitive.Root {...props} open={open} onOpenChange={change} /></State>;
}

export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetPortal = Primitive.Portal;
export function SheetOverlay({className = "", ...props}: ComponentProps<typeof Primitive.Overlay>) {
 const {reduced} = useAingMotion();
 return <Primitive.Overlay {...props} asChild forceMount><motion.div data-slot="sheet-overlay" className={`fixed inset-0 z-50 bg-foreground/20 ${className}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0, transition:{duration:reduced ? 0 : .12}}} transition={reduced ? {duration:0} : easeOut} /></Primitive.Overlay>;
}
export function SheetContent({className = "", children, side = "right", ...props}: ComponentProps<typeof Primitive.Content> & {side?: "top" | "right" | "bottom" | "left"}) {
 const {open} = useContext(State);
 const {reduced, transition} = useAingMotion();
 const position = {right:"inset-y-0 right-0 h-dvh w-[min(90vw,400px)] border-y-0 border-r-0", left:"inset-y-0 left-0 h-dvh w-[min(90vw,400px)] border-y-0 border-l-0", top:"inset-x-0 top-0 max-h-[85dvh] rounded-b-[var(--radius)]", bottom:"inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[var(--radius)]"}[side];
 const hidden = {opacity:0, x:side === "left" ? "-100%" : side === "right" ? "100%" : 0, y:side === "top" ? "-100%" : side === "bottom" ? "100%" : 0};
 return <Primitive.Portal forceMount><AnimatePresence>{open && <div key="panel"><SheetOverlay/><Primitive.Content {...props} forceMount asChild><motion.div data-slot="sheet-content" className={`fixed z-50 flex flex-col gap-5 overflow-y-auto border bg-background p-6 text-sm text-foreground shadow-lg outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 ${position} ${className}`} initial={reduced ? false : hidden} animate={{opacity:1, scale:1, x:0, y:0}} exit={{...hidden, transition:{duration:reduced ? 0 : .12}}} transition={transition}>{children}<Primitive.Close aria-label="닫기" className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:bg-muted outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"><span aria-hidden>×</span></Primitive.Close></motion.div></Primitive.Content></div>}</AnimatePresence></Primitive.Portal>;
}
export function SheetHeader({className = "", ...props}: ComponentProps<"div">) {return <div className={`grid gap-1.5 pr-6 ${className}`} {...props}/>;}
export function SheetFooter({className = "", ...props}: ComponentProps<"div">) {return <div className={`mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`} {...props}/>;}
export function SheetTitle({className = "", ...props}: ComponentProps<typeof Primitive.Title>) {return <Primitive.Title className={`text-base font-semibold tracking-tight ${className}`} {...props}/>;}
export function SheetDescription({className = "", ...props}: ComponentProps<typeof Primitive.Description>) {return <Primitive.Description className={`text-[13px] leading-relaxed text-muted-foreground ${className}`} {...props}/>;}
