"use client";
import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { Popover as Primitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";

const State = createContext({open: false});
export type PopoverProps = ComponentProps<typeof Primitive.Root> & WebMCPProps & { label?: string };
export function Popover({open: controlled, defaultOpen = false, onOpenChange, label = "Popover", webmcp, toolName: name, ...props}: PopoverProps) {
 const [local, setLocal] = useState(defaultOpen);
 const open = controlled ?? local;
 const id = useId();
 const change = (next: boolean) => {setLocal(next); onOpenChange?.(next);};
 const options = {webmcp, toolName: name};
 useWebMCPTool(webmcp === false ? null : { name: toolName("open", id, options, name || (webmcp && webmcp.name) ? "_open" : "", label), description: `${webmcp && webmcp.description || label}: open`, inputSchema: {type:"object", properties:{}, additionalProperties:false}, execute: () => {change(true); return result({open:true});} });
 useWebMCPTool(webmcp === false ? null : { name: toolName("close", id, options, name || (webmcp && webmcp.name) ? "_close" : "", label), description: `${webmcp && webmcp.description || label}: close`, inputSchema: {type:"object", properties:{}, additionalProperties:false}, execute: () => {change(false); return result({open:false});} });
 return <State value={{open}}><Primitive.Root {...props} open={open} onOpenChange={change} /></State>;
}
export const PopoverTrigger = Primitive.Trigger;
export const PopoverPortal = Primitive.Portal;
export const PopoverClose = Primitive.Close;
export const PopoverAnchor = Primitive.Anchor;
export function PopoverContent({className = "", children, sideOffset = 8, ...props}: ComponentProps<typeof Primitive.Content>) {
 const {open} = useContext(State); const {reduced, transition} = useAingMotion();
 return <Primitive.Portal forceMount><AnimatePresence>{open && <Primitive.Content {...props} key="content" forceMount sideOffset={sideOffset} asChild><motion.div data-slot="popover-content" className={`z-50 max-w-[calc(100vw-2rem)] origin-[var(--radix-popover-content-transform-origin)] rounded-[var(--radius)] border bg-popover text-popover-foreground shadow-md outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 w-72 p-4 ${className}`} initial={reduced ? false : {opacity:0, scale:.94, y:4}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:.97, transition:{duration:reduced ? 0 : .1}}} transition={transition}>{children}</motion.div></Primitive.Content>}</AnimatePresence></Primitive.Portal>;
}
