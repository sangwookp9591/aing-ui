"use client";
import * as CSS from "@/registry/aing/ui/select";
import * as Tailwind from "@/registry/aing/tailwind/select";
import { Label } from "@/registry/aing/ui/label";
import { Globe } from "lucide-react";
import { useId, useState } from "react";
export default function ComponentDemo({
  compact = false,
  styling = "css",
}: {
  compact?: boolean;
  styling?: "css" | "tailwind";
}) {
  const {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectSeparator,
  } = styling === "tailwind" ? Tailwind : CSS;
  const id = useId();
  const [value, setValue] = useState("seoul");
  return (
    <section
      data-form="select"
      className="w-full rounded-lg border bg-card text-card-foreground shadow-xs"
    >
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="grid size-8 place-items-center rounded-md border bg-muted/40">
          <Globe aria-hidden size={15} />
        </span>
        <div>
          <p className="text-[13px] font-medium">Select</p>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground">WORKSPACE / 08</p>
        </div>
        <span className="ml-auto size-1.5 rounded-full bg-foreground/50" />
      </header>
      <div className={compact ? "p-4" : "p-5"}>
        <Label htmlFor={id}>기본 지역</Label>
        <Select toolName="choose_region" value={value} onValueChange={setValue}>
          <SelectTrigger id={id} className="mt-3">
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Asia Pacific</SelectLabel>
              <SelectItem value="seoul">
                <span aria-hidden="true">🌏 </span>Seoul, Korea
              </SelectItem>
              <SelectItem value="tokyo">
                <span aria-hidden="true">🗼 </span>Tokyo, Japan
              </SelectItem>
              <SelectItem value="singapore">
                <span aria-hidden="true">🌴 </span>Singapore
              </SelectItem>
              <SelectSeparator />
              <SelectItem value="sydney" disabled>
                <span aria-hidden="true">🌉 </span>Sydney · 준비 중
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <footer
        aria-live="polite"
        className="border-t px-5 py-3 text-[11px] leading-5 text-muted-foreground"
      >{`현재 지역 · ${value}`}</footer>
    </section>
  );
}
