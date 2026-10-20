"use client";
import { Switch as Primitive } from "radix-ui";
import { motion } from "motion/react";
import { useId,useState,type ComponentProps } from "react";
import { useAingMotion } from "@/registry/aing/lib/motion";
import { result,toolName,useWebMCPTool,type WebMCPProps } from "@/registry/aing/lib/webmcp";
const Root=motion.create(Primitive.Root);
export type SwitchProps=ComponentProps<typeof Root>&WebMCPProps;
export function Switch({checked,defaultChecked=false,onCheckedChange,webmcp,toolName:name,className="",...props}:SwitchProps){
 const id=useId(),[internal,setInternal]=useState(defaultChecked);const value=checked??internal;const {reduced,transition}=useAingMotion();
 const change=(next:boolean)=>{setInternal(next);onCheckedChange?.(next);};const label=props["aria-label"]??props.name??props.id??"Switch";
 useWebMCPTool(webmcp===false?null:{name:toolName("set",id,{webmcp,toolName:name},"",label),description:webmcp?.description??`${label} 스위치를 설정합니다.`,inputSchema:{type:"object",properties:{checked:{type:"boolean"}},required:["checked"],additionalProperties:false},execute:({checked:next})=>{if(props.disabled||typeof next!=="boolean")throw new Error("사용 가능한 스위치 상태를 입력하세요.");change(next);return result({checked:next});}});
 return <Root {...props} checked={value} onCheckedChange={change} whileTap={reduced?{}:{scale:0.96}} transition={transition} className={`peer inline-flex h-[22px] w-10 shrink-0 items-center rounded-full border border-transparent bg-input p-0.5 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-45 data-[state=checked]:bg-primary ${className}`}><Primitive.Thumb asChild><motion.span initial={false} animate={{x:value?18:0}} whileTap={reduced?{}:{scaleX:1.15}} transition={transition} className="block size-4 rounded-full bg-background shadow-xs"/></Primitive.Thumb></Root>;
}
