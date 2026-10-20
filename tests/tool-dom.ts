import { Window } from "happy-dom";
import type { ModelContext } from "../packages/core/src/webmcp";
export function createToolDocument() {
  const browser = new Window();
  Object.defineProperty(globalThis, "MutationObserver", {
    value: browser.MutationObserver,
    configurable: true,
  });
  Object.defineProperty(browser.HTMLElement.prototype, "getClientRects", { value: () => [1] });
  Object.defineProperty(globalThis, "getComputedStyle", {
    value: (element: Element) => ({
      visibility: browser.getComputedStyle(element as never).visibility || "visible",
    }),
    configurable: true,
  });
  return browser.document as unknown as Document & { modelContext?: ModelContext };
}
