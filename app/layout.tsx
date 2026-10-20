import { PageEntrance } from "@/components/site-motion";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Command } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";
// 본문 서체. 굵기가 바뀌어도 글자 폭이 같아(uniwidth) 호버·선택 때 레이아웃이 흔들리지 않는다. 한글은 시스템 서체로 떨어진다.
const host = Host_Grotesk({ subsets: ["latin"], variable: "--font-host", display: "swap" });
export const metadata: Metadata = { title: "aing-ui — 사람과 에이전트를 위한 UI", description: "복사해서 쓰는 WebMCP 컴포넌트. 사람의 인터랙션을 에이전트의 도구로." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className={host.variable}><body>
    <a href="#main" className="sr-only focus:not-sr-only">본문으로 건너뛰기</a>
    <header className="border-b bg-background"><nav aria-label="주 메뉴" className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 sm:px-10">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-[-.06em]"><span className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground">a.</span>aing-ui<span className="ml-1 hidden rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-normal text-muted-foreground sm:block">0.1</span></Link>
      <Link href="/docs/ai-chat" className="text-xs text-muted-foreground hover:text-foreground">컴포넌트</Link>
      <div className="ml-auto flex items-center gap-4"><span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground sm:flex"><Command aria-hidden size={12} />WEBMCP READY</span><ThemeToggle /></div>
    </nav></header>
    <PageEntrance>{children}</PageEntrance>
    <footer className="mx-auto mt-20 flex max-w-[1360px] flex-wrap justify-between gap-3 border-t px-5 py-7 text-[10px] text-muted-foreground sm:px-10"><span>aing-ui · 직접 소유하는 인터페이스</span><span className="flex items-center gap-1.5 font-mono">Built for humans & agents<ArrowUpRight aria-hidden size={12} /></span></footer>
  </body></html>;
}
