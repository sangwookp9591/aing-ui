"use client";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  AingTool,
  Invokers,
  composeRefs,
  useControllable,
  useControlTool,
  result,
  type WebMCPProps,
} from "./react.js";
export type DialogProps = WebMCPProps & {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
  alert?: boolean;
};

export function createDialog(styles: {
  content: string;
  header: string;
  body: string;
  footer: string;
  title: string;
  description: string;
  x: string;
  tailwind?: boolean;
}) {
  const State = createContext({
    id: "",
    open: false,
    change: (_: boolean) => {},
    alert: false,
    controlled: false,
  });
  function Dialog({
    open: controlled,
    defaultOpen = false,
    onOpenChange,
    label = "Dialog",
    webmcp,
    toolName,
    children,
    alert = false,
  }: DialogProps) {
    const id = useId(),
      [open, change] = useControllable(controlled, defaultOpen, onOpenChange);
    const options = { webmcp, toolName: toolName ? `${toolName}_open` : undefined };
    const target = () => document.getElementById(`${id}-trigger`);
    const tool = (next: boolean) => ({
      description: next ? `${label} 열기` : alert ? "취소" : "닫기",
      annotations: alert ? { consequentialHint: false } : undefined,
      inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
      execute: () => {
        change(next);
        return result({ open: next });
      },
    });
    useControlTool("open", options, target, !open ? tool(true) : null);
    useControlTool(
      "close",
      { webmcp, toolName: toolName ? `${toolName}_close` : undefined },
      () => document.getElementById(id),
      open ? tool(false) : null,
    );
    return (
      <State value={{ id, open, change, alert, controlled: controlled !== undefined }}>
        <Invokers />
        {children}
      </State>
    );
  }
  type ActionProps = ComponentProps<"button"> & { asChild?: boolean };
  function Action({ asChild, children, command, ...props }: ActionProps) {
    const { id, change, controlled } = useContext(State);
    function onClick(event: React.MouseEvent<HTMLButtonElement>) {
      props.onClick?.(event);
      if (event.defaultPrevented) return;
      // Safari records the return target only after explicit trigger focus.
      if (command === "show-modal") event.currentTarget.focus({ preventScroll: true });
      if (controlled) {
        event.preventDefault();
        change(command === "show-modal");
      }
    }
    const action = {
      ...props,
      type: props.type ?? "button",
      command,
      commandfor: id,
      id: command === "show-modal" ? `${id}-trigger` : props.id,
      onClick,
    };
    const button =
      asChild && isValidElement<ComponentProps<"button">>(children) ? (
        cloneElement(children, {
          ...action,
          ...(typeof children.type !== "string" ? { webmcp: false } : {}),
          onClick: (event) => {
            children.props.onClick?.(event);
            if (!event.defaultPrevented) onClick(event);
          },
        })
      ) : (
        <button {...action}>{children}</button>
      );
    return (
      <>
        {button}
        {props["data-aing-consequential" as keyof typeof props] && <AingTool consequential />}
      </>
    );
  }
  const DialogTrigger = (props: ActionProps) => <Action {...props} command="show-modal" />;
  const DialogClose = (props: ActionProps) => <Action {...props} command="close" />;
  const DialogPortal = ({ children }: { children?: ReactNode }) => children;
  const DialogOverlay = (_: ComponentProps<"div">) => null;
  function contains(node: ReactNode, type: unknown): boolean {
    return Children.toArray(node).some(
      (child) =>
        isValidElement<{ children?: ReactNode }>(child) &&
        (child.type === type || contains(child.props.children, type)),
    );
  }
  function DialogContent({
    children,
    className = "",
    closeLabel = "닫기",
    ref,
    onClose,
    onCancel,
    onToggle,
    ...props
  }: Omit<ComponentProps<"dialog">, "open"> & { closeLabel?: string }) {
    const state = useContext(State),
      element = useRef<HTMLDialogElement>(null);
    const committed = useRef(state.open);
    useLayoutEffect(() => {
      committed.current = state.open;
      const dialog = element.current;
      if (!dialog) return;
      if (state.open && !dialog.open) dialog.showModal();
      if (!state.open && dialog.open) dialog.close();
    }, [state.open]);
    function handleClose(event: React.SyntheticEvent<HTMLDialogElement>) {
      onClose?.(event);
      const dialog = event.currentTarget;
      if (state.open) state.change(false);
      if (state.controlled)
        queueMicrotask(() => {
          if (committed.current && !dialog.open && dialog.isConnected) dialog.showModal();
        });
    }
    function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
      onCancel?.(event);
      if (!event.defaultPrevented) {
        if (state.controlled) event.preventDefault();
        state.change(false);
      }
    }
    const description = contains(children, DialogDescription)
      ? `${state.id}-description`
      : undefined;
    return (
      <dialog
        {...props}
        ref={composeRefs(element, ref)}
        id={state.id}
        data-slot="dialog-content"
        data-aing-tailwind={styles.tailwind ? "dialog" : undefined}
        role={state.alert ? "alertdialog" : "dialog"}
        closedby={state.alert ? "closerequest" : "any"}
        aria-labelledby={props["aria-labelledby"] ?? `${state.id}-title`}
        aria-describedby={props["aria-describedby"] ?? description}
        className={`${styles.content} ${className}`}
        onClose={handleClose}
        onCancel={handleCancel}
        onToggle={(event) => {
          onToggle?.(event);
          if (!state.controlled && !state.open && event.newState === "open") state.change(true);
        }}
      >
        {children}
        <DialogClose className={styles.x} aria-label={closeLabel}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="m6 6 12 12M6 18 18 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </DialogClose>
      </dialog>
    );
  }
  function DialogHeader({ className = "", ...props }: ComponentProps<"div">) {
    return <div className={`${styles.header} ${className}`} {...props} />;
  }
  function DialogBody({ className = "", ref, onScroll, ...props }: ComponentProps<"div">) {
    const element = useRef<HTMLDivElement>(null);
    function update() {
      const body = element.current;
      if (!body) return;
      body.toggleAttribute("data-scroll-start", body.scrollTop > 0);
      body.toggleAttribute(
        "data-scroll-end",
        body.scrollTop + body.clientHeight < body.scrollHeight - 1,
      );
    }
    useEffect(() => {
      const body = element.current!;
      const observer = new ResizeObserver(update);
      observer.observe(body);
      for (const child of body.children) observer.observe(child);
      update();
      return () => observer.disconnect();
    }, []);
    return (
      <div
        {...props}
        data-dialog-body
        ref={composeRefs(element, ref)}
        className={`${styles.body} ${className}`}
        onScroll={(event) => {
          update();
          onScroll?.(event);
        }}
      />
    );
  }
  function DialogFooter({ className = "", ...props }: ComponentProps<"div">) {
    return <div data-slot="dialog-footer" className={`${styles.footer} ${className}`} {...props} />;
  }
  function DialogTitle({ className = "", ...props }: ComponentProps<"h2">) {
    const { id } = useContext(State);
    return <h2 id={`${id}-title`} className={`${styles.title} ${className}`} {...props} />;
  }
  function DialogDescription({ className = "", ...props }: ComponentProps<"p">) {
    const { id } = useContext(State);
    return (
      <p id={`${id}-description`} className={`${styles.description} ${className}`} {...props} />
    );
  }
  const AlertDialog = (props: DialogProps) => <Dialog {...props} alert />;
  const AlertDialogTrigger = DialogTrigger,
    AlertDialogContent = DialogContent,
    AlertDialogTitle = DialogTitle,
    AlertDialogDescription = DialogDescription;
  const AlertDialogAction = (props: ActionProps) => (
    <DialogClose {...props} data-aing-consequential />
  );
  const AlertDialogCancel = (props: ActionProps) => <DialogClose autoFocus {...props} />;

  return {
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
  };
}
