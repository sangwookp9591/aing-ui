"use client";
import { createSelect } from "@aing/core/select";
export type { SelectProps } from "@aing/core/select";
export const {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} = createSelect({
  select: `w-full min-w-11 min-h-11 px-3 py-2 border border-border rounded-md bg-background
      text-foreground text-sm leading-5 shadow-xs items-center
      transition-[transform,background-color] duration-160 ease-[var(--aing-spring)]
      hover:enabled:bg-muted active:scale-99 disabled:opacity-45
      disabled:cursor-not-allowed aria-busy:opacity-100 aria-busy:cursor-progress
      data-[size=sm]:p-2 data-[size=sm]:text-xs focus-visible:outline-3
      focus-visible:outline-ring/50 focus-visible:outline-offset-0
      focus-visible:[box-shadow:none] aria-invalid:border-destructive
      user-invalid:border-destructive
      has-[option[value=""]:checked]:text-muted-foreground
      motion-reduce:transition-none
      supports-[appearance:base-select]:[appearance:base-select] [&_option]:min-h-11
      [&_option]:p-3 [&_option]:rounded-md [&_option]:text-sm
      [&_option]:text-foreground [&_option:checked]:font-semibold
      [&_option]:bg-transparent [&_option:hover]:bg-muted
      [&:has(option:hover)_option:focus-visible:not(:hover)]:bg-transparent
      [&_option:focus-visible]:outline-none [&_option:focus-visible]:shadow-none
      [&_option:focus-visible]:bg-muted [&_option:disabled]:opacity-45
      [&_option[hidden]]:hidden [&_optgroup]:p-0 [&_legend]:px-3 [&_legend]:py-2
      [&_legend]:text-xs [&_legend]:font-medium [&_legend]:text-muted-foreground
      [&_hr]:h-px [&_hr]:my-1 [&_hr]:border-0 [&_hr]:bg-border col-start-1 row-start-1`,
  frame: `relative grid w-full`,
  spinner: `pointer-events-none col-start-1 row-start-1 z-1 mr-3 size-4 self-center
      justify-self-end text-muted-foreground animate-spin motion-reduce:animate-none`,
  tailwind: true,
});
