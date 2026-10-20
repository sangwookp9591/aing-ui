"use client";
import { createDialog } from "@aing/core/dialog";
export type { DialogProps } from "@aing/core/dialog";
export const {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} = createDialog({
  content: `fixed inset-0 grid gap-6 w-[min(448px,100%-32px)] max-h-[85dvh] m-auto p-6
      border border-border rounded-lg bg-background text-foreground overflow-auto
      shadow-[0_0_0_1px_rgb(0_0_0/.04),0_20px_64px_rgb(0_0_0/.2)] opacity-0
      translate-y-2 scale-97 not-open:hidden open:opacity-100 open:translate-y-0
      open:scale-100 transition-[opacity,translate,scale,display,overlay]
      duration-150 transition-discrete ease-[var(--aing-dialog-ease)]
      open:duration-220
      sheet:pb-[max(24px,env(safe-area-inset-bottom)+16px)]
      sheet:w-full sheet:m-0 sheet:mt-auto
      sheet:max-h-[90dvh] sheet:rounded-[12px_12px_0_0] motion-reduce:transition-none
      has-[>[data-dialog-body]]:grid-rows-[auto_minmax(0,1fr)_auto]
      has-[>[data-dialog-body]]:overflow-hidden sheet:max-w-none
      sheet:translate-y-6 sheet:scale-100
      sheet:open:translate-y-0`,
  header: `sticky -top-6 z-1 grid gap-2 pr-6 bg-background`,
  body: `min-h-0 overflow-auto border-y border-transparent data-scroll-start:border-t-border
      data-scroll-end:border-b-border`,
  footer: `[&_button]:min-h-11 sticky -bottom-6 flex flex-wrap justify-end gap-2 bg-background`,
  title: `m-0 text-xl font-semibold tracking-[-.02em] leading-7`,
  description: `m-0 text-[13px] leading-5 text-muted-foreground`,
  x: `absolute top-2 right-2 z-2 grid size-11 place-items-center rounded-md border-0
      bg-transparent text-muted-foreground transition-transform duration-160
      ease-[var(--aing-spring)] hover:bg-muted active:scale-94 focus-visible:outline-3
      focus-visible:outline-ring/50 focus-visible:outline-offset-0
      motion-reduce:transition-none`,
  tailwind: true,
});
