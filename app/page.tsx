import { HeroTitle, Reveal } from "@/components/site-motion";
import { AgentPanel } from "@/components/demo";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Box, Code2, MousePointer2 } from "lucide-react";
import { catalog } from "@/lib/catalog";
import { InstallCommand } from "@/components/install-command";
import { Demo } from "@/components/demo";
export default function Home() {
  return <main id="main" className="mx-auto max-w-[1280px] px-5 sm:px-10">
    <section className="grid gap-10 border-b pt-16 pb-14 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-24">
      <div><p className="mb-6 flex items-center gap-2 font-mono text-[10px] tracking-[.1em] text-muted-foreground"><span className="size-1.5 rounded-full bg-[#33cc33]" />OPEN CODE. SHARED ACTIONS.</p>
        <HeroTitle />
        <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">클릭과 도구 호출, 같은 동작으로 연결하세요.<br />내 코드로 가져오는 {catalog.length}가지 WebMCP 컴포넌트.</p>
        <div className="mt-7 flex items-center gap-5"><Link href="/docs/tool-call" className="flex items-center gap-3 rounded-md bg-primary px-4 py-2.5 text-xs text-primary-foreground">컴포넌트 둘러보기<ArrowRight aria-hidden size={14} /></Link><a href="#components" className="text-xs text-muted-foreground hover:text-foreground">미리보기 ↓</a></div>
      </div>
      <div className="space-y-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg border bg-muted/50"><Code2 aria-hidden size={17} /></span><div><p className="text-xs font-medium">설치하고, 소유하세요.</p><p className="mt-1 text-[11px] text-muted-foreground">런타임 패키지 대신 수정 가능한 소스 코드.</p></div><span className="ml-auto font-mono text-[10px] text-muted-foreground">01 / {String(catalog.length).padStart(2,"0")}</span></div><InstallCommand name="tool-call" /><p className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground"><Box aria-hidden size={11} />React 19<span> / </span>Tailwind 4<span> / </span>shadcn registry</p></div>
    </section>
    <section id="components" className="pt-9"><div className="mb-6 flex items-end justify-between"><div><p className="mb-2 font-mono text-[9px] tracking-widest text-muted-foreground">THE COLLECTION</p><h2 className="text-xl font-semibold tracking-[-.04em]">작은 컴포넌트. 같은 가능성.</h2></div><span className="hidden items-center gap-1.5 font-mono text-[9px] text-muted-foreground sm:flex"><MousePointer2 aria-hidden size={11} />ALL PREVIEWS ARE LIVE</span></div>
      <div className="grid gap-5 md:grid-cols-2">{catalog.map((item, i) => <Reveal key={item.name} index={i} className={i === catalog.length-1 ? "md:col-span-2" : ""}><article className="group/collection flex h-full min-w-0 flex-col overflow-hidden rounded-xl border transition-transform duration-200 hover:-translate-y-1 focus-within:transform-none motion-reduce:transform-none [&_[data-mini]>div]:transition-transform [&_[data-mini]>div]:duration-300 hover:[&_[data-mini]>div]:scale-[1.015] motion-reduce:[&_[data-mini]>div]:transform-none"><Demo name={item.name} compact /><Link href={`/docs/${item.name}`} className="group flex items-center gap-3 border-t bg-card px-5 py-4"><span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span><div><h3 className="text-sm font-medium tracking-tight">{item.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{item.description}</p></div><ArrowUpRight aria-hidden size={15} className="ml-auto shrink-0 text-muted-foreground group-hover:text-foreground" /></Link></article></Reveal>)}</div>
    </section>
    <AgentPanel />
  </main>;
}
