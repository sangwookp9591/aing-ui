type Layer = { element: HTMLElement; close: () => void };
const stacks = new WeakMap<Document, Layer[]>();
const handled = new WeakSet<Event>();
export function dismiss(element: HTMLElement, close: () => void) {
  const doc = element.ownerDocument,
    stack = stacks.get(doc) ?? [];
  stacks.set(doc, stack);
  const layer = { element, close },
    parent = stack.findIndex((item) => element.contains(item.element));
  stack.splice(parent < 0 ? stack.length : parent, 0, layer);
  const listener = (event: Event) => {
    if (stack.at(-1) !== layer || event.defaultPrevented || handled.has(event)) return;
    if (
      event.type === "keydown"
        ? (event as KeyboardEvent).key === "Escape"
        : !event.composedPath().includes(element)
    ) {
      handled.add(event);
      if (event.type === "keydown") {
        event.preventDefault();
        event.stopPropagation();
      }
      close();
    }
  };
  doc.addEventListener("pointerdown", listener);
  doc.addEventListener("keydown", listener);
  return () => {
    const i = stack.indexOf(layer);
    if (i >= 0) stack.splice(i, 1);
    doc.removeEventListener("pointerdown", listener);
    doc.removeEventListener("keydown", listener);
  };
}
