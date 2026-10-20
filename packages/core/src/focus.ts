const enabled = (items: HTMLElement[]) =>
  items.filter((el) => !el.matches(':disabled,[aria-disabled="true"]'));
const selector = "a[href],button,input,select,textarea,[tabindex]";
export const focusable = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(selector)].filter(
    (el) =>
      !el.matches(":disabled,[hidden]") &&
      el.tabIndex >= 0 &&
      !el.closest("[inert],[hidden]") &&
      el.getClientRects().length &&
      !["hidden", "collapse"].includes(
        el.ownerDocument.defaultView!.getComputedStyle(el).visibility,
      ),
  );
export function trapFocus(root: HTMLElement) {
  const previous = root.ownerDocument.activeElement as HTMLElement | null;
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const items = focusable(root),
      current = root.ownerDocument.activeElement;
    if (
      !items.length ||
      !root.contains(current) ||
      current === (event.shiftKey ? items[0] : items.at(-1))
    ) {
      event.preventDefault();
      (items.at(event.shiftKey ? -1 : 0) ?? root).focus();
    }
  };
  root.addEventListener("keydown", keydown);
  return () => {
    root.removeEventListener("keydown", keydown);
    if (previous?.isConnected) previous.focus();
  };
}
export function roving(items: HTMLElement[], index = 0) {
  const activate = (active: HTMLElement) =>
    items.forEach((item) => {
      item.tabIndex = item === active ? 0 : -1;
    });
  activate(items[index]);
  return (event: KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const list = enabled(items);
    if (!list.length) return;
    const at = list.indexOf(event.target as HTMLElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? list.length - 1
          : (at + (keys.indexOf(event.key) < 2 ? 1 : -1) + list.length) % list.length;
    activate(list[next]);
    list[next].focus();
  };
}
export function typeahead(items: () => HTMLElement[], timeout = 500) {
  let text = "",
    time = 0;
  return (event: KeyboardEvent) => {
    if (
      event.key.length !== 1 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.isComposing
    )
      return;
    text = (event.timeStamp - time > timeout ? "" : text) + event.key.toLocaleLowerCase();
    time = event.timeStamp;
    const list = enabled(items());
    const start = list.indexOf(event.target as HTMLElement) + 1;
    const query = [...text].every((c) => c === text[0]) ? text[0] : text;
    [...list.slice(start), ...list.slice(0, start)]
      .find((el) => el.textContent?.trim().toLocaleLowerCase().startsWith(query))
      ?.focus();
  };
}
