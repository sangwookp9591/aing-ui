"use client";
import { easeOut,useAingMotion } from "@/registry/aing/lib/motion";
import { Check,Copy } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import { useEffect,useRef,useState } from "react";
export function CopyButton({text, label = "코드 복사"}: {text:string; label?:string}) {
 const [status,setStatus] = useState("");
 const [fallback,setFallback] = useState(false);
 const selection = useRef<HTMLTextAreaElement>(null);
 const {reduced} = useAingMotion();
 useEffect(() => { if (fallback) {selection.current?.focus(); selection.current?.select();} }, [fallback]);
 useEffect(() => { if (!status) return; const timer = setTimeout(() => setStatus(""), 2200); return () => clearTimeout(timer); }, [status]);
 return <span className="inline-flex items-center gap-2">
  <button type="button" aria-label={label} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-muted" onClick={async () => {try {await navigator.clipboard.writeText(text); setStatus("복사됨"); setFallback(false);} catch {setFallback(true); setStatus("선택한 텍스트를 직접 복사하세요");}}}>
   <AnimatePresence initial={false} mode="wait"><motion.span key={status === "복사됨" ? "check" : "copy"} initial={{opacity:0,scale:0.7,y:3}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.7,y:-3}} transition={reduced ? {duration:0} : {...easeOut,duration:0.12}}>{status === "복사됨" ? <Check aria-hidden size={13}/> : <Copy aria-hidden size={13}/>}</motion.span></AnimatePresence>
   <span>{status === "복사됨" ? status : label}</span>
  </button><span role="status" aria-live="polite" className="sr-only">{status}</span>
  {fallback && <textarea ref={selection} aria-label="직접 복사할 텍스트" readOnly value={text} className="fixed inset-x-5 bottom-5 z-50 h-32 rounded-lg border bg-background p-3 text-xs shadow-lg" onBlur={() => setFallback(false)} />}
 </span>;
}
export function CodeBlock({code,className=""}:{code:string;className?:string}) {
 return <div className={`relative rounded-lg border bg-card ${className}`}><div className="absolute top-2 right-2 rounded-md bg-card"><CopyButton text={code}/></div><pre className="p-5 pt-12 font-mono text-xs leading-7"><code>{code}</code></pre></div>;
}
