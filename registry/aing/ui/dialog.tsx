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
  content: `aing-dialog`,
  header: `aing-dialog-header`,
  body: `aing-dialog-body`,
  footer: `aing-dialog-footer`,
  title: `aing-dialog-title`,
  description: `aing-dialog-description`,
  x: `aing-dialog-x`,
});
