"use client";
import * as CSS from "@/registry/aing/ui/button";
import * as Tailwind from "@/registry/aing/tailwind/button";
import { Zap, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
export default function ComponentDemo({
  compact = false,
  styling = "css",
}: {
  compact?: boolean;
  styling?: "css" | "tailwind";
}) {
  const { Button } = styling === "tailwind" ? Tailwind : CSS;
  const [saved, setSaved] = useState(0),
    [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const save = () => {
    setLoading(true);
    timer.current = setTimeout(() => {
      setSaved((n) => n + 1);
      setLoading(false);
    }, 700);
  };
  return (
    <section
      data-form="button"
      className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"
    >
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="grid size-8 place-items-center rounded-md border bg-muted/40">
          <Zap aria-hidden size={15} />
        </span>
        <div>
          <p className="text-[13px] font-medium">Button</p>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 01</p>
        </div>
        <span className="ml-auto size-1.5 rounded-full bg-foreground/50" />
      </header>
      <div className={compact ? "p-4" : "p-5"}>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            toolName="save_changes"
            aria-label="변경사항 저장 · Save changes"
            loading={loading}
            onClick={save}
          >
            <Check size={14} aria-hidden />
            변경사항 저장
          </Button>
          <Button toolName="reset_changes" variant="outline" onClick={() => setSaved(0)}>
            초기화
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
          <Button variant="link" size="sm">
            Link
          </Button>
        </div>
      </div>
      <footer
        aria-live="polite"
        className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground"
      >
        {saved ? `${saved}회 저장했습니다.` : "준비되면 변경사항을 저장하세요."}
      </footer>
    </section>
  );
}
