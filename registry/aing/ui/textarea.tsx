"use client";
import { motion, type HTMLMotionProps } from "motion/react";
import { useId, useRef } from "react";
import { useAingMotion } from "@/registry/aing/lib/motion";
import { result, toolName, useWebMCPTool, type WebMCPProps } from "@/registry/aing/lib/webmcp";
export type TextareaProps = HTMLMotionProps<"textarea"> & WebMCPProps;
export function Textarea({ toolName:name, webmcp, className="", ref, ...props }: TextareaProps) {
 const id=useId(), element=useRef<HTMLTextAreaElement|null>(null); const {reduced,transition,entrance}=useAingMotion();
 const label=props["aria-label"] ?? props.name ?? props.id ?? "Textarea";
 useWebMCPTool(webmcp===false ? null : {name:toolName("fill",id,{toolName:name,webmcp},"",label),description:webmcp?.description ?? `${label}에 텍스트를 입력합니다.`,inputSchema:{type:"object",properties:{text:{type:"string",maxLength:props.maxLength!==undefined && props.maxLength>=0 ? props.maxLength : 10000}},required:["text"],additionalProperties:false},execute:({text})=>{
  const node=element.current;
  if(!node||props.disabled||props.readOnly||node.matches(":disabled")||node.readOnly)throw new Error("입력할 수 없는 필드입니다.");
  if(typeof text!=="string"||text.length>(props.maxLength!==undefined && props.maxLength>=0 ? props.maxLength : 10000))throw new Error("입력 길이를 확인하세요.");
  
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;
  const previous=node.value;
  setter?.call(node,text);
  if(node.value!==text || !node.validity.valid || (props.minLength!==undefined && text.length<props.minLength)) { setter?.call(node,previous); throw new Error("입력 형식과 제약 조건을 확인하세요."); }
  node.dispatchEvent(new Event("input",{bubbles:true}));node.dispatchEvent(new Event("change",{bubbles:true}));
  return result({filled:true});
 }});
 return <motion.textarea {...entrance} {...props} ref={node=>{element.current=node;if(typeof ref==="function")ref(node);else if(ref)ref.current=node;}} whileHover={reduced?{}:{y:-1}} transition={transition} className={`min-h-28 resize-y w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45 ${className}`}/>;
}
