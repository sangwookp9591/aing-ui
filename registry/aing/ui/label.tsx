"use client";
import { Label as Primitive } from "radix-ui";
import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { useAingMotion } from "@/registry/aing/lib/motion";
import type { WebMCPProps } from "@/registry/aing/lib/webmcp";
const MotionLabel=motion.create(Primitive.Root);
export function Label({className="",webmcp,toolName,...props}:ComponentProps<typeof MotionLabel>&WebMCPProps){
 void webmcp;void toolName;const {entrance,reduced,transition}=useAingMotion();
 return <MotionLabel {...entrance} {...props} whileTap={reduced?{}:{scale:0.98}} transition={transition} className={`inline-flex items-center gap-2 text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-45 ${className}`}/>;
}
