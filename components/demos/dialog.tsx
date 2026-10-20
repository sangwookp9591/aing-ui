"use client";
import { useState } from "react";
import { Settings2, Check, ArrowUpRight } from "lucide-react";
import * as CSS from "@/registry/aing/ui/dialog";
import * as Tailwind from "@/registry/aing/tailwind/dialog";
export default function Demo({
  compact = false,
  styling = "css",
}: {
  compact?: boolean;
  styling?: "css" | "tailwind";
}) {
  const {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogBody,
    DialogClose,
  } = styling === "tailwind" ? Tailwind : CSS;
  const [saved, setSaved] = useState(false);
  return (
    <div data-overlay-demo="dialog" className="grid w-full justify-items-center gap-4">
      <div className="flex size-11 items-center justify-center rounded-[var(--radius)] border bg-background shadow-xs">
        <Settings2 size={19} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">내 작업 공간</p>
        {!compact && (
          <p className="mt-1 text-[13px] text-muted-foreground">작은 설정으로, 더 편안하게.</p>
        )}
      </div>
      <Dialog toolName="workspace_dialog" label="workspace dialog">
        <DialogTrigger asChild>
          <button className="min-h-11 rounded-[calc(var(--radius)-2px)] border bg-background px-3.5 py-2 text-[13px] font-medium shadow-xs outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20">
            설정 열기 <ArrowUpRight size={13} className="ml-2 inline" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <span className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Workspace / Preferences
            </span>
            <DialogTitle>작업 공간 설정</DialogTitle>
            <DialogDescription>
              지금 필요한 알림만 받아보세요. 설정은 이 데모에만 적용됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="min-h-11 rounded-[calc(var(--radius)-2px)] border bg-muted/30 p-4">
              <label className="flex items-start gap-3 text-[13px]">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 accent-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
                />
                <span>
                  <span className="block font-medium">활동 요약 받기</span>
                  <span className="mt-1 block text-muted-foreground">
                    팀의 새로운 소식을 한 번에 모아 보세요.
                  </span>
                </span>
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <button className="min-h-11 rounded-[calc(var(--radius)-2px)] border bg-background px-3.5 py-2 text-[13px] font-medium shadow-xs outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20">
                취소
              </button>
            </DialogClose>
            <DialogClose asChild>
              <button
                onClick={() => setSaved(true)}
                className="min-h-11 rounded-[calc(var(--radius)-2px)] bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                설정 저장
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
        {saved && (
          <>
            <Check size={12} className="mr-1 inline" />
            설정을 저장했어요.
          </>
        )}
      </p>
    </div>
  );
}
