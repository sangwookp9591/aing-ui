"use client";
import { catalogGroups } from "@/lib/catalog";
import { fadeUp,spring,stagger,useAingMotion } from "@/registry/aing/lib/motion";
import { motion,useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
export function Reveal({children,index=0,className=""}:{children:ReactNode;index?:number;className?:string}) {
 const {reduced}=useAingMotion();
 return <motion.div initial={fadeUp.hidden} whileInView={fadeUp.visible} viewport={{once:true,amount:0.08}} transition={reduced ? {duration:0} : stagger(index)} className={className}>{children}</motion.div>;
}
// 경로를 key로 쓰면 메뉴를 누를 때마다 페이지 전체가 다시 마운트되며 투명→불투명으로 깜빡인다.
// 첫 진입에만 한 번 나타나게 하고, 이후 이동은 바뀐 영역만 갈아 끼운다.
export function PageEntrance({children}:{children:ReactNode}) {
 const {entrance}=useAingMotion();
 return <motion.div {...entrance}>{children}</motion.div>;
}
export function HeroTitle() {
 const reduced=useReducedMotion();
 return <h1 className="text-[40px] font-semibold leading-[1.2] tracking-[-.065em] sm:text-[58px]">{["사람의 인터페이스.","에이전트의 도구."].map((line,index)=><span key={line} className={`block ${index ? "text-muted-foreground" : ""}`}>{line.split(" ").map((word,i)=><motion.span className="inline-block" key={word} initial={fadeUp.hidden} animate={fadeUp.visible} transition={reduced?{duration:0}:stagger(index*2+i)}>{word}{i===0?"\u00a0":""}</motion.span>)}</span>)}</h1>;
}
export function Sidebar({name}:{name:string}) {
 const reduced=useReducedMotion();
 return <nav aria-label="컴포넌트 목록" className="space-y-5">{catalogGroups.map(group=><div key={group.id}><p className="mb-2 font-mono text-[9px] tracking-widest text-muted-foreground">{group.title}</p><div className="flex flex-wrap gap-1 lg:flex-col">{group.items.map(c=><Link key={c.name} href={`/docs/${c.name}`} aria-current={c.name===name?"page":undefined} className="relative isolate flex items-center gap-2 rounded-md px-2.5 py-2.5 text-xs text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">{c.name===name&&<motion.span layoutId="sidebar-active" className="absolute inset-0 -z-10 rounded-md bg-muted" transition={reduced?{duration:0}:spring}/>} {c.title}<span className="ml-auto hidden rounded border px-1 py-0.5 font-mono text-[8px] leading-none lg:inline">new</span></Link>)}{group.items.length===0&&<span className="px-2.5 text-[10px] text-muted-foreground">준비 중</span>}</div></div>)}</nav>;
}
