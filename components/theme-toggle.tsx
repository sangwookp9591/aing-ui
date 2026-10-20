"use client";
import { Moon,Sun } from "lucide-react";
export function ThemeToggle() {
  return <button type="button" aria-label="라이트 / 다크 테마 전환" className="grid size-8 place-items-center rounded-md border hover:bg-muted" onClick={() => document.documentElement.classList.toggle("dark")}><Moon aria-hidden size={14} className="dark:hidden" /><Sun aria-hidden size={14} className="hidden dark:block" /></button>;
}
