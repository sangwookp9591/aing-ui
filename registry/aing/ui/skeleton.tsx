"use client";
import { motion, type HTMLMotionProps } from "motion/react";
import { useAingMotion } from "../lib/motion";
import type { WebMCPProps } from "../lib/webmcp";
export function Skeleton({ className = "", ...props }: HTMLMotionProps<"div"> & WebMCPProps) {
  delete props.webmcp;
  delete props.toolName;
  const { reduced, transition } = useAingMotion();
  return <motion.div aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition} {...props} className={`relative overflow-hidden rounded-md bg-muted ${className}`}><motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent" initial={{ x: "-100%", opacity: 0 }} animate={reduced ? { x: "-100%", opacity: 0 } : { x: ["-100%", "100%"], opacity: [0, 1, 0] }} transition={reduced ? { duration: 0 } : { duration: 1.6, repeat: Infinity, ease: "linear" }} /></motion.div>;
}
