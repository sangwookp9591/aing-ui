import "react";
declare module "react" {
  interface ButtonHTMLAttributes<T> {
    command?:
      | "show-modal"
      | "close"
      | "request-close"
      | "show-popover"
      | "hide-popover"
      | "toggle-popover"
      | `--${string}`;
    commandfor?: string;
    interestfor?: string;
  }
  interface DialogHTMLAttributes<T> {
    closedby?: "any" | "closerequest" | "none";
  }
  interface AnchorHTMLAttributes<T> {
    interestfor?: string;
  }
  interface InputHTMLAttributes<T> {
    switch?: "";
  }
}
