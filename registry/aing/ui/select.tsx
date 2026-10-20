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
  select: `aing-select`,
  frame: `aing-select-frame`,
  spinner: `aing-select-spinner`,
});
