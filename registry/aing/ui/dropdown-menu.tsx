"use client";
import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { DropdownMenu as Primitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";

const State = createContext({open: false});
export type DropdownMenuProps = ComponentProps<typeof Primitive.Root> & WebMCPProps & { label?: string };
export function DropdownMenu({open: controlled, defaultOpen = false, onOpenChange, label = "DropdownMenu", webmcp, toolName: name, ...props}: DropdownMenuProps) {
 const [local, setLocal] = useState(defaultOpen);
 const open = controlled ?? local;
 const id = useId();
 const change = (next: boolean) => {setLocal(next); onOpenChange?.(next);};
 const options = {webmcp, toolName: name};
 useWebMCPTool(webmcp === false ? null : { name: toolName("open", id, options, name || (webmcp && webmcp.name) ? "_open" : "", label), description: `${webmcp && webmcp.description || label}: open`, inputSchema: {type:"object", properties:{}, additionalProperties:false}, execute: () => {change(true); return result({open:true});} });
 useWebMCPTool(webmcp === false ? null : { name: toolName("close", id, options, name || (webmcp && webmcp.name) ? "_close" : "", label), description: `${webmcp && webmcp.description || label}: close`, inputSchema: {type:"object", properties:{}, additionalProperties:false}, execute: () => {change(false); return result({open:false});} });
 return <State value={{open}}><Primitive.Root {...props} open={open} onOpenChange={change} /></State>;
}
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuPortal = Primitive.Portal;
const Highlight = createContext("");
export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;
export const DropdownMenuSub = Primitive.Sub;
export function DropdownMenuLabel({className = "", inset, ...props}: ComponentProps<typeof Primitive.Label> & {inset?: boolean}) {return <Primitive.Label className={`px-2 py-1.5 text-[11px] font-medium text-muted-foreground ${inset ? "pl-8" : ""} ${className}`} {...props}/>;}
export function DropdownMenuSeparator({className = "", ...props}: ComponentProps<typeof Primitive.Separator>) {return <Primitive.Separator className={`-mx-1 my-1 h-px bg-border ${className}`} {...props}/>;}
export function DropdownMenuShortcut({className = "", ...props}: ComponentProps<"span">) {return <span className={`ml-auto pl-6 text-[11px] text-muted-foreground ${className}`} {...props}/>;}
export function DropdownMenuItem({className = "", children, inset, variant = "default", ...props}: ComponentProps<typeof Primitive.Item> & {inset?: boolean; variant?: "default" | "destructive"}) {
 const [active, setActive] = useState(false); const group = useContext(Highlight); const {transition} = useAingMotion();
 return <Primitive.Item {...props} onFocus={event => {setActive(true); props.onFocus?.(event);}} onBlur={event => {setActive(false); props.onBlur?.(event);}} className={`relative flex cursor-default select-none items-center gap-2 rounded-[calc(var(--radius)-4px)] px-2 py-2 text-[13px] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 ${inset ? "pl-8" : ""} ${variant === "destructive" ? "text-destructive" : ""} ${className}`}>{active && <motion.span layoutId={group} transition={transition} className="absolute inset-0 rounded-[inherit] bg-muted"/>}<span className="relative flex w-full items-center gap-2">{children}</span></Primitive.Item>;
}
export function DropdownMenuCheckboxItem({className = "", children, ...props}: ComponentProps<typeof Primitive.CheckboxItem>) {return <Primitive.CheckboxItem {...props} className={`relative flex items-center gap-2 rounded-sm px-2 py-2 text-[13px] outline-none focus:bg-muted data-[disabled]:opacity-40 ${className}`}><span className="w-3"><Primitive.ItemIndicator>✓</Primitive.ItemIndicator></span>{children}</Primitive.CheckboxItem>;}
export function DropdownMenuRadioItem({className = "", children, ...props}: ComponentProps<typeof Primitive.RadioItem>) {return <Primitive.RadioItem {...props} className={`flex items-center gap-2 rounded-sm px-2 py-2 text-[13px] outline-none focus:bg-muted data-[disabled]:opacity-40 ${className}`}><span className="w-3"><Primitive.ItemIndicator>•</Primitive.ItemIndicator></span>{children}</Primitive.RadioItem>;}
export function DropdownMenuSubTrigger({className = "", children, inset, ...props}: ComponentProps<typeof Primitive.SubTrigger> & {inset?: boolean}) {return <Primitive.SubTrigger {...props} className={`flex items-center gap-2 rounded-sm px-2 py-2 text-[13px] outline-none focus:bg-muted data-[state=open]:bg-muted ${inset ? "pl-8" : ""} ${className}`}>{children}<span className="ml-auto">›</span></Primitive.SubTrigger>;}
export function DropdownMenuSubContent({className = "", ...props}: ComponentProps<typeof Primitive.SubContent>) {const {transition} = useAingMotion(); return <Primitive.Portal><Primitive.SubContent {...props} asChild><motion.div className={`z-50 min-w-40 rounded-[var(--radius)] border bg-popover p-1 text-popover-foreground shadow-md ${className}`} initial={{opacity:0, scale:.96}} animate={{opacity:1, scale:1}} transition={transition}/></Primitive.SubContent></Primitive.Portal>;}
export function DropdownMenuContent({className = "", children, sideOffset = 8, ...props}: ComponentProps<typeof Primitive.Content>) {
 const {open} = useContext(State); const {reduced, transition} = useAingMotion(); const id = useId();
 return <Primitive.Portal forceMount><AnimatePresence>{open && <Primitive.Content {...props} key="content" forceMount sideOffset={sideOffset} asChild><motion.div data-slot="dropdown-menu-content" className={`z-50 max-w-[calc(100vw-2rem)] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-[var(--radius)] border bg-popover text-popover-foreground shadow-md outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 min-w-52 p-1 ${className}`} initial={reduced ? false : {opacity:0, scale:.94, y:4}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:.97, transition:{duration:reduced ? 0 : .1}}} transition={transition}><Highlight value={id}>{children}</Highlight></motion.div></Primitive.Content>}</AnimatePresence></Primitive.Portal>;
}
