"use client";
import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
export const spring = { type: "spring", stiffness: 460, damping: 32 } as const;
export const easeOut = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;
export const fadeUp = { hidden: {opacity: 0, y: 6, filter: "blur(4px)"}, visible: {opacity: 1, y: 0, filter: "blur(0px)"} };
export const stagger = (index: number) => ({...easeOut, delay: Math.min(index, 12) * 0.045});
let keyboard = false;
function subscribeInput(callback: () => void) {
 const key = () => {keyboard = true; callback();};
 const pointer = () => {keyboard = false; callback();};
 window.addEventListener("keydown", key); window.addEventListener("pointerdown", pointer);
 return () => {window.removeEventListener("keydown", key); window.removeEventListener("pointerdown", pointer);};
}
export function useAingMotion() {
 const prefersReduced = useReducedMotion();
 const keyboardInput = useSyncExternalStore(subscribeInput, () => keyboard, () => false);
 const reduced = prefersReduced || keyboardInput;
 return {reduced, transition: reduced ? {duration: 0} : spring, entrance: {initial: fadeUp.hidden, animate: fadeUp.visible, transition: reduced ? {duration:0} : easeOut}};
}
