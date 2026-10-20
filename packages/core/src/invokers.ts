export function installInvokers(doc: Document) {
  const view = doc.defaultView!;
  const pointer = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    if (!("commandForElement" in view.HTMLButtonElement.prototype)) {
      const button = (event.target as Element).closest?.(
        "button[commandfor]",
      ) as HTMLButtonElement | null;
      if (button && !button.matches(":disabled")) {
        const target = doc.getElementById(
          button.getAttribute("commandfor")!,
        ) as HTMLDialogElement | null;
        const command = button.getAttribute("command");
        if (target && command === "show-modal" && !target.open) target.showModal();
        if (target && command === "close") target.close(button.value);
        if (target && command === "request-close") {
          if (target.requestClose) target.requestClose(button.value);
          else if (target.dispatchEvent(new Event("cancel", { cancelable: true })))
            target.close(button.value);
        }
      }
    }
    if (!("closedBy" in view.HTMLDialogElement.prototype)) {
      const dialog = event.target as HTMLDialogElement;
      if (dialog.tagName !== "DIALOG" || !dialog.open || dialog.getAttribute("closedby") !== "any")
        return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      ) {
        if (dialog.requestClose) dialog.requestClose();
        else if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) dialog.close();
      }
    }
  };
  doc.addEventListener("click", pointer);
  return () => doc.removeEventListener("click", pointer);
}
