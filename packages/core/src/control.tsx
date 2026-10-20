import { registerTool, toolName, type AingTool, type WebMCPProps } from "./webmcp.js";

export function accessibleName(element: HTMLElement) {
  const ids = element.getAttribute("aria-labelledby");
  const labelled =
    ids &&
    ids
      .split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ");
  return (
    labelled ||
    element.getAttribute("aria-label") ||
    Array.from((element as HTMLInputElement).labels ?? [], (label) => label.textContent).join(
      " ",
    ) ||
    (element.matches("button,a,dialog") ? element.textContent : "") ||
    ""
  ).trim();
}

const listeners = new Set<() => void>();
let observer: MutationObserver | undefined;
let modals: Element[] = [];
function modalChange(event: Event) {
  const target = event.target as Element;
  if ((event as ToggleEvent).newState === "open") {
    modals = [...modals.filter((dialog) => dialog !== target && dialog.matches(":modal")), target];
  }
  queueMicrotask(refresh);
}
function watch(update: () => void) {
  listeners.add(update);
  if (!observer) {
    observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    window.addEventListener("resize", refresh);
    document.addEventListener("beforetoggle", modalChange, true);
  }
  update();
  return () => {
    listeners.delete(update);
    if (!listeners.size) {
      observer!.disconnect();
      observer = undefined;
      window.removeEventListener("resize", refresh);
      document.removeEventListener("beforetoggle", modalChange, true);
      modals = [];
    }
  };
}
function refresh() {
  listeners.forEach((listener) => listener());
}
function available(element: HTMLElement | null, allowWhileModal: boolean) {
  const modal =
    modals.findLast((dialog) => dialog.matches(":modal")) ??
    document.activeElement?.closest("dialog:modal") ??
    document.querySelector("dialog:modal");
  if (!allowWhileModal && modal && !modal.contains(element)) return false;
  return (
    element?.isConnected &&
    element.getClientRects().length &&
    !element.closest("[inert],[hidden],dialog:not([open])") &&
    getComputedStyle(element).visibility === "visible" &&
    !element.matches(':disabled,[aria-disabled="true"],[aria-busy="true"]')
  );
}
export function observeControl(
  prefix: string,
  props: WebMCPProps,
  target: () => HTMLElement | null,
  tool: Omit<AingTool, "name">,
  latest: () => Omit<AingTool, "name"> | null,
  allowWhileModal = false,
) {
  let previous: string | undefined, dispose: (() => void) | undefined;
  const stop = watch(() => {
    const element = target(),
      label = prefix && element && accessibleName(element),
      dialog = /^(open|close)$/.test(prefix);
    const next =
      available(element, allowWhileModal) && (label || !prefix)
        ? !prefix
          ? (tool as AingTool)
          : {
              ...tool,
              name: toolName(
                prefix,
                dialog
                  ? "dialog"
                  : (prefix === "click" &&
                      [
                        (element as HTMLButtonElement).name,
                        (element as HTMLButtonElement).value,
                        (element as HTMLButtonElement).form?.id,
                      ].find((value) => value?.match(/\w/))) ||
                      element!.localName,
                props,
                !props.toolName && props.webmcp && props.webmcp.name && dialog ? `_${prefix}` : "",
                label as string,
              ),
              description:
                (props.webmcp && props.webmcp.description) ||
                (tool.description.includes(label as string)
                  ? tool.description
                  : `${label}: ${tool.description}`),
              annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                ...tool.annotations,
                consequentialHint:
                  tool.annotations?.consequentialHint ??
                  element!.hasAttribute("data-aing-consequential"),
              },
            }
        : null;
    const descriptor = JSON.stringify(next);
    if (descriptor === previous) return;
    dispose?.();
    previous = descriptor;
    dispose = next
      ? registerTool(next, () => {
          const current = latest();
          if (!current || !available(target(), allowWhileModal))
            throw Error("Unavailable: modal/inert/hidden/disabled");
          return current;
        })
      : undefined;
  });
  return () => {
    stop();
    dispose?.();
  };
}
