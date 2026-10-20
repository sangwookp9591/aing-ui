"use client";
import { RadioGroup as Primitive } from "radix-ui";
import { AnimatePresence,motion } from "motion/react";
import { createContext,useContext,useId,useState,type ComponentProps } from "react";
import { useAingMotion } from "@/registry/aing/lib/motion";
import { optionValues,result,toolName,useWebMCPTool,type WebMCPProps } from "@/registry/aing/lib/webmcp";
const Selection=createContext("");
export function RadioGroup({value,defaultValue="",onValueChange,webmcp,toolName:name,children,className="",...props}:ComponentProps<typeof Primitive.Root>&WebMCPProps){
 const id=useId(),[internal,setInternal]=useState(defaultValue);const selected=value??internal,options=optionValues(children);const label=props["aria-label"]??props.name??props.id??"Radio group";
 const change=(next:string)=>{setInternal(next);onValueChange?.(next);};
 useWebMCPTool(webmcp===false?null:{name:toolName("choose",id,{webmcp,toolName:name},"",label),description:webmcp?.description??`${label} 옵션을 선택합니다.`,inputSchema:{type:"object",properties:{value:{type:"string",enum:options}},required:["value"],additionalProperties:false},execute:({value:next})=>{if(props.disabled||typeof next!=="string"||!options.includes(next))throw new Error("사용 가능한 옵션을 선택하세요.");change(next);return result({value:next});}});
 return <Selection.Provider value={selected}><Primitive.Root {...props} value={selected} onValueChange={change} className={`grid gap-3 ${className}`}>{children}</Primitive.Root></Selection.Provider>;
}
const Item=motion.create(Primitive.Item);
export function RadioGroupItem({className="",...props}:ComponentProps<typeof Item>){
 const value=useContext(Selection),{reduced,transition}=useAingMotion();
 return <Item {...props} whileTap={reduced?{}:{scale:0.9}} transition={transition} className={`grid size-[18px] shrink-0 place-items-center rounded-full border border-input bg-background text-primary shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-45 data-[state=checked]:border-primary ${className}`}><Primitive.Indicator forceMount asChild><span><AnimatePresence initial={false}>{value===props.value&&<motion.span key="dot" initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}} transition={transition} className="block size-2 rounded-full bg-current"/>}</AnimatePresence></span></Primitive.Indicator></Item>;
}
