"use client";
import { createContext, useCallback, useContext, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Toast as Primitive, Portal } from "radix-ui";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { useAingMotion } from "../lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "../lib/webmcp";

type ToastMessage = {title: string; description?: string; duration?: number; action?: ReactNode};
type Entry = ToastMessage & {id: number; open: boolean};
type ToastStore = {toasts: Entry[]; toast: (message: ToastMessage) => {id: number; dismiss: () => void}; dismiss: (id?: number) => void};
const Store = createContext<ToastStore | null>(null);
export function useToast() {const store = useContext(Store); if (!store) throw new Error("useToast requires ToastProvider"); return store;}
export function ToastProvider({children, webmcp, toolName: name, ...props}: ComponentProps<typeof Primitive.Provider> & WebMCPProps) {
 const [toasts, setToasts] = useState<Entry[]>([]); const counter = useRef(0); const id = useId();
 const dismiss = useCallback((id?: number) => setToasts(items => items.map(item => id === undefined || id === item.id ? {...item, open:false} : item)), []);
 const toast = useCallback((message: ToastMessage) => {const id = ++counter.current; setToasts(items => [...items.filter(item => item.open), {...message, id, open:true}].slice(-3)); return {id, dismiss: () => dismiss(id)};}, [dismiss]);
 useWebMCPTool(webmcp === false ? null : {name:toolName("show",id,{webmcp,toolName:name},"_toast"), description:webmcp && webmcp.description || "Show a notification", inputSchema:{type:"object", properties:{title:{type:"string", minLength:1, maxLength:120}, description:{type:"string", maxLength:500}}, required:["title"], additionalProperties:false}, execute: input => {if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 120 || (input.description !== undefined && (typeof input.description !== "string" || input.description.length > 500))) throw new Error("title must be 1–120 characters and description at most 500"); const {id} = toast({title:input.title, description:input.description as string | undefined}); return result({shown:true,id});}});
 return <Store value={{toasts,toast,dismiss}}><Primitive.Provider {...props}>{children}</Primitive.Provider></Store>;
}
export function Toast({open: controlled, defaultOpen = true, onOpenChange, children, className = "", onSwipeMove, onSwipeCancel, onSwipeEnd, ...props}: ComponentProps<typeof Primitive.Root>) {
 const [local, setLocal] = useState(defaultOpen); const open = controlled ?? local; const {reduced, transition} = useAingMotion(); const x = useMotionValue(0);
 return <AnimatePresence>{open && <Primitive.Root {...props} forceMount open={open} onOpenChange={value => {setLocal(value); onOpenChange?.(value);}} asChild onSwipeMove={event => {x.set(event.detail.delta.x); onSwipeMove?.(event);}} onSwipeCancel={event => {x.set(0); onSwipeCancel?.(event);}} onSwipeEnd={event => {onSwipeEnd?.(event);}}><motion.li data-slot="toast" layout={!reduced} style={{x, touchAction:"pan-y"}} className={`pointer-events-auto relative grid w-full gap-1 rounded-[var(--radius)] border bg-background p-4 pr-9 text-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 ${className}`} initial={reduced ? false : {opacity:0, y:24, scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0, y:12, scale:.96, transition:{duration:reduced ? 0 : .1}}} transition={transition}>{children}</motion.li></Primitive.Root>}</AnimatePresence>;
}
export function ToastViewport({className = "", ...props}: ComponentProps<typeof Primitive.Viewport>) {return <Portal.Root asChild><Primitive.Viewport {...props} className={`fixed bottom-4 right-4 z-[100] flex max-h-dvh w-[calc(100%-2rem)] max-w-sm flex-col-reverse gap-2 outline-none ${className}`}/></Portal.Root>;}
export function ToastTitle({className = "", ...props}: ComponentProps<typeof Primitive.Title>) {return <Primitive.Title {...props} className={`text-[13px] font-medium ${className}`}/>;}
export function ToastDescription({className = "", ...props}: ComponentProps<typeof Primitive.Description>) {return <Primitive.Description {...props} className={`text-[13px] leading-relaxed text-muted-foreground ${className}`}/>;}
export function ToastClose({className = "", children, ...props}: ComponentProps<typeof Primitive.Close>) {return <Primitive.Close aria-label="알림 닫기" {...props} className={`absolute right-2 top-2 rounded-sm p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/20 ${className}`}>{children ?? <span aria-hidden>×</span>}</Primitive.Close>;}
export function ToastAction({className = "", ...props}: ComponentProps<typeof Primitive.Action>) {return <Primitive.Action {...props} className={`mt-2 w-fit rounded-md border px-2 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/20 ${className}`}/>;}
export type ToastProps = ComponentProps<typeof Toast>;
export type ToastActionElement = React.ReactElement<ComponentProps<typeof ToastAction>>;
export function Toaster() {const {toasts,dismiss} = useToast(); return <>{toasts.map(item => <Toast key={item.id} open={item.open} duration={item.duration} onOpenChange={open => {if (!open) dismiss(item.id);}}><ToastTitle>{item.title}</ToastTitle>{item.description && <ToastDescription>{item.description}</ToastDescription>}{item.action}<ToastClose/></Toast>)}<ToastViewport/></>;}
