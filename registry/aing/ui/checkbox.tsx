"use client";
import { Checkbox as Primitive } from "radix-ui";
import { AnimatePresence,motion } from "motion/react";
import { useId,useState,type ComponentProps } from "react";
import { useAingMotion } from "@/registry/aing/lib/motion";
import { result,toolName,useWebMCPTool,type WebMCPProps } from "@/registry/aing/lib/webmcp";
const Root=motion.create(Primitive.Root);
export type CheckboxProps=ComponentProps<typeof Root>&WebMCPProps;
export function Checkbox({checked,defaultChecked=false,onCheckedChange,webmcp,toolName:name,className="",...props}:CheckboxProps){
 const id=useId(),[internal,setInternal]=useState(defaultChecked);const value=checked??internal;const {reduced,transition}=useAingMotion();
 const change=(next:boolean|"indeterminate")=>{setInternal(next);onCheckedChange?.(next);};
 const label=props["aria-label"]??props.name??props.id??"Checkbox";
 useWebMCPTool(webmcp===false?null:{name:toolName("set",id,{webmcp,toolName:name},"",label),description:webmcp?.description??`${label} 체크 상태를 설정합니다.`,inputSchema:{type:"object",properties:{checked:{type:"boolean"}},required:["checked"],additionalProperties:false},execute:({checked:next})=>{if(props.disabled||typeof next!=="boolean")throw new Error("사용 가능한 체크 상태를 입력하세요.");change(next);return result({checked:next});}});
 return <Root {...props} checked={value} onCheckedChange={change} whileTap={reduced?{}:{scale:0.9}} transition={transition} className={`peer grid size-[18px] shrink-0 place-items-center rounded-[calc(var(--radius)-6px)] border border-input bg-background text-primary-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-45 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary ${className}`}><Primitive.Indicator forceMount asChild><span className="grid place-items-center"><AnimatePresence initial={false}>{value!==false&&<motion.svg key={String(value)} aria-hidden viewBox="0 0 16 16" className="size-3.5" initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.7}} transition={reduced?{duration:0}:{duration:0.12}}><motion.path d={value==="indeterminate"?"M4 8h8":"m3 8 3 3 7-7"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{pathLength:0}} animate={{pathLength:1}} transition={transition}/></motion.svg>}</AnimatePresence></span></Primitive.Indicator></Root>;
}
