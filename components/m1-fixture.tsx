"use client";
import { useState } from "react";
import type { ButtonProps } from "@/registry/aing/ui/button";
import * as CSSButton from "@/registry/aing/ui/button";
import * as TWButton from "@/registry/aing/tailwind/button";
import * as CSSDialog from "@/registry/aing/ui/dialog";
import * as TWDialog from "@/registry/aing/tailwind/dialog";
import * as CSSSelect from "@/registry/aing/ui/select";
import * as TWSelect from "@/registry/aing/tailwind/select";
export function M1Fixture() {
  const [styling, setStyling] = useState<"css" | "tailwind">("css");
  const { Button } = styling === "css" ? CSSButton : TWButton;
  const {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
    DialogClose,
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
  } = styling === "css" ? CSSDialog : TWDialog;
  const { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } =
    styling === "css" ? CSSSelect : TWSelect;
  const [count, setCount] = useState(0),
    [region, setRegion] = useState("seoul"),
    [submitted, setSubmitted] = useState(""),
    [saved, setSaved] = useState(false);
  return (
    <>
      <fieldset className="flex gap-4 text-sm">
        <legend className="mb-2">스타일</legend>
        {(["css", "tailwind"] as const).map((style) => (
          <label key={style} className="flex gap-2">
            <input
              type="radio"
              name="fixture-style"
              checked={styling === style}
              onChange={() => setStyling(style)}
            />
            {style === "css" ? "순수 CSS" : "Tailwind v4"}
          </label>
        ))}
      </fieldset>
      <section
        aria-labelledby="buttons-title"
        data-testid="buttons"
        className="rounded-lg border bg-card p-6"
      >
        <header className="mb-6 flex justify-between">
          <h2 id="buttons-title" className="font-medium">
            01 · Button
          </h2>
          <span className="font-mono text-xs text-muted-foreground">PRESS / FOCUS / WAIT</span>
        </header>
        <div className="flex flex-wrap gap-3">
          {(
            [
              "default",
              "secondary",
              "outline",
              "ghost",
              "destructive",
              "link",
            ] as ButtonProps["variant"][]
          ).map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            toolName="m1_save"
            aria-label="변경사항 저장 · Save changes"
            onClick={() => setCount((n) => n + 1)}
          >
            변경사항 저장
          </Button>
          <Button size="sm" variant="outline">
            Small
          </Button>
          <Button size="lg" variant="secondary">
            Large
          </Button>
          <Button size="icon" aria-label="Add">
            +
          </Button>
          <Button disabled>사용 불가</Button>
          <Button loading aria-label="저장 중 · Saving">
            저장 중
          </Button>
          <Button aria-invalid="true" variant="outline">
            다시 시도
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground" role="status" data-testid="save-status">
          {count}회 저장
        </p>
      </section>
      <section
        aria-labelledby="select-title"
        data-testid="select"
        className="rounded-lg border bg-card p-6"
      >
        <h2 id="select-title" className="mb-6 font-medium">
          02 · Select
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(String(new FormData(event.currentTarget).get("region")));
          }}
          className="grid max-w-sm gap-3"
        >
          <label htmlFor="m1-region" className="text-sm">
            기본 지역
          </label>
          <Select name="region" toolName="m1_region" value={region} onValueChange={setRegion}>
            <SelectTrigger id="m1-region">
              <SelectValue placeholder="지역 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seoul">Seoul</SelectItem>
              <SelectItem value="tokyo">Tokyo</SelectItem>
              <SelectItem value="sydney" disabled>
                Sydney · 준비 중
              </SelectItem>
            </SelectContent>
          </Select>
          <Button toolName="apply_region" type="submit" variant="outline">
            지역 적용
          </Button>
          <output data-testid="form-output" className="text-sm text-muted-foreground">
            {submitted}
          </output>
        </form>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Select aria-label="Empty">
            <SelectTrigger>
              <SelectValue placeholder="선택 가능한 지역 없음" />
            </SelectTrigger>
          </Select>
          <Select aria-label="Disabled" disabled defaultValue="one">
            <SelectItem value="one">사용 불가</SelectItem>
          </Select>
          <Select aria-label="Loading" loading>
            <SelectItem value="one">불러오는 중</SelectItem>
          </Select>
          <Select aria-label="Invalid" aria-invalid="true">
            <SelectTrigger>
              <SelectValue placeholder="지역을 선택해 주세요" />
            </SelectTrigger>
            <SelectItem value="one">Seoul</SelectItem>
          </Select>
        </div>
        <p data-testid="region-status" className="mt-4 text-sm text-muted-foreground">
          선택 · {region}
        </p>
      </section>
      <section
        aria-labelledby="dialog-title"
        data-testid="dialogs"
        className="rounded-lg border bg-card p-6"
      >
        <h2 id="dialog-title" className="mb-6 font-medium">
          03 · Dialog
        </h2>
        <div className="flex flex-wrap gap-3">
          <Dialog label="Preferences" toolName="m1_dialog">
            <DialogTrigger asChild>
              <Button variant="outline">설정 열기</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>작업 공간 설정</DialogTitle>
                <DialogDescription>
                  필요한 알림만 받아보세요. 변경사항은 이 데모에만 적용됩니다.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <label className="grid gap-2 text-sm">
                  작업 공간 이름
                  <input
                    name="workspace"
                    autoFocus
                    defaultValue="My workspace"
                    className="min-h-11 rounded-md border bg-background px-3"
                  />
                </label>
                <Select aria-label="Dialog region" defaultValue="seoul">
                  <SelectItem value="seoul">Seoul</SelectItem>
                  <SelectItem value="tokyo">Tokyo</SelectItem>
                </Select>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">취소</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => setSaved(true)}>설정 저장</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog label="Delete">
            <DialogTrigger asChild>
              <Button variant="destructive">작업 공간 삭제</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>작업 공간을 삭제할까요?</DialogTitle>
              <DialogDescription>이 동작은 되돌릴 수 없습니다.</DialogDescription>
              <DialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">유지하기</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive">삭제하기</Button>
                </AlertDialogAction>
              </DialogFooter>
            </DialogContent>
          </AlertDialog>
        </div>
        <p role="status" data-testid="dialog-status" className="mt-4 text-sm text-muted-foreground">
          {saved ? "설정을 저장했습니다." : "내 작업에 맞게 설정하세요."}
        </p>
      </section>
    </>
  );
}
