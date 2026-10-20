"use client";
import "./platform.js";
import { observeControl } from "./control.js";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
  type Ref,
} from "react";
import {
  getLogs,
  subscribeLogs,
  result,
  type AingTool as Tool,
  type WebMCPProps,
} from "./webmcp.js";
import { attach, type Side } from "./position.js";
import { dismiss } from "./dismiss.js";
import { trapFocus } from "./focus.js";
export { toolName, result } from "./webmcp.js";
export type { WebMCPProps } from "./webmcp.js";
const emptyLogs: ReturnType<typeof getLogs> = [];
const toolCount = () => window.__aingToolDefinitions?.size ?? 0;
const subscribeTools = (update: () => void) => {
  window.addEventListener("aing:tools", update);
  return () => window.removeEventListener("aing:tools", update);
};
export const useWebMCPStatus = () => useSyncExternalStore(subscribeTools, toolCount, () => 0);
export const useWebMCPToolLog = () => useSyncExternalStore(subscribeLogs, getLogs, () => emptyLogs);
const body = () => document.body;
export function useWebMCPTool(
  tool: Tool | null,
  {
    target = body,
    allowWhileModal = false,
  }: {
    target?: () => HTMLElement | null;
    allowWhileModal?: boolean;
  } = {},
) {
  const current = useRef({ tool, target });
  useLayoutEffect(() => {
    current.current = { tool, target };
  });
  const descriptor = tool
    ? JSON.stringify({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      })
    : null;
  useLayoutEffect(
    () =>
      descriptor
        ? observeControl(
            "",
            {},
            () => current.current.target(),
            JSON.parse(descriptor),
            () => current.current.tool,
            allowWhileModal,
          )
        : undefined,
    [descriptor, allowWhileModal, target],
  );
}
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    });
    return () =>
      refs.forEach((ref, index) => {
        const cleanup = cleanups[index];
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      });
  };
}
export function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [local, setLocal] = useState(defaultValue);
  return [
    value === undefined ? local : value,
    (next: T) => {
      if (value === undefined) setLocal(next);
      onChange?.(next);
    },
  ] as const;
}
export function useAnchor(
  pop: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
  side?: Side,
) {
  useEffect(
    () => (pop.current && trigger.current ? attach(pop.current, trigger.current, side) : undefined),
    [pop, trigger, side],
  );
}
export function useDismiss(ref: RefObject<HTMLElement | null>, close: () => void, active = true) {
  useEffect(
    () => (active && ref.current ? dismiss(ref.current, close) : undefined),
    [ref, close, active],
  );
}
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => (active && ref.current ? trapFocus(ref.current) : undefined), [ref, active]);
}
let invokers: Promise<() => void> | undefined;
let invokerUsers = 0;
export function Invokers() {
  useEffect(() => {
    if (
      !document.defaultView ||
      ("commandForElement" in HTMLButtonElement.prototype &&
        "closedBy" in HTMLDialogElement.prototype)
    )
      return;
    invokerUsers++;
    const pending = (invokers ??= import("./invokers.js").then(({ installInvokers }) =>
      installInvokers(document),
    ));
    return () => {
      invokerUsers--;
      pending.then((dispose) => {
        if (!invokerUsers && invokers === pending) {
          dispose();
          invokers = undefined;
        }
      });
    };
  }, []);
  return null;
}
export function useControlTool(
  prefix: string,
  props: WebMCPProps,
  target: () => HTMLElement | null,
  tool: Omit<Tool, "name"> | null,
) {
  const current = useRef({ tool, target });
  useLayoutEffect(() => {
    current.current = { tool, target };
  });
  const descriptor = tool ? JSON.stringify({ ...tool, execute: undefined }) : null;
  const options = JSON.stringify(props);
  useEffect(
    () =>
      descriptor && props.webmcp !== false
        ? observeControl(
            prefix,
            JSON.parse(options),
            () => current.current.target(),
            JSON.parse(descriptor),
            () => current.current.tool,
          )
        : undefined,
    [prefix, descriptor, options, props.webmcp],
  );
}
export function AingTool({
  webmcp,
  toolName: name,
  consequential = false,
  actionable = true,
}: WebMCPProps & { label?: string; consequential?: boolean; actionable?: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  const registered = useWebMCPStatus();
  const target = () => marker.current?.previousElementSibling as HTMLElement | null;
  useEffect(() => {
    const element = target();
    const block = (event: Event) => {
      if (element?.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    element?.addEventListener("click", block, true);
    return () => element?.removeEventListener("click", block, true);
  }, []);
  useControlTool(
    "click",
    { webmcp, toolName: name },
    target,
    actionable
      ? {
          description: "버튼을 누릅니다.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { consequentialHint: consequential || undefined },
          execute: () => {
            target()!.click();
            return result({ clicked: true });
          },
        }
      : null,
  );
  return <span hidden ref={marker} data-aing-tools={registered} />;
}

const noSubscription = () => () => {};
export const useBaseSelect = () =>
  useSyncExternalStore(
    noSubscription,
    () => typeof CSS !== "undefined" && CSS.supports("appearance", "base-select"),
    () => false,
  );
