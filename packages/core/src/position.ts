export type Side = "top" | "bottom" | "left" | "right";
export function place(
  a: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
  p: { width: number; height: number },
  width: number,
  height: number,
  side: Side = "bottom",
  gap = 4,
) {
  const fits = (s: Side) =>
    s === "bottom"
      ? a.bottom + gap + p.height <= height
      : s === "top"
        ? a.top - gap - p.height >= 0
        : s === "right"
          ? a.right + gap + p.width <= width
          : a.left - gap - p.width >= 0;
  const opposite: Record<Side, Side> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };
  const chosen = fits(side) || !fits(opposite[side]) ? side : opposite[side];
  const vertical = chosen === "top" || chosen === "bottom";
  return {
    x: Math.max(
      0,
      Math.min(
        vertical ? a.left : chosen === "right" ? a.right + gap : a.left - gap - p.width,
        width - p.width,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        !vertical ? a.top : chosen === "bottom" ? a.bottom + gap : a.top - gap - p.height,
        height - p.height,
      ),
    ),
    side: chosen,
  };
}
export const anchorSupported = () =>
  typeof CSS !== "undefined" && CSS.supports("anchor-name", "--a");
export function attach(pop: HTMLElement, trigger: HTMLElement, side: Side = "bottom") {
  if (anchorSupported()) return () => {};
  const view = pop.ownerDocument.defaultView!;
  const update = () => {
    if (!pop.matches(":popover-open")) return;
    const { x, y } = place(
      trigger.getBoundingClientRect(),
      pop.getBoundingClientRect(),
      view.innerWidth,
      view.innerHeight,
      side,
    );
    Object.assign(pop.style, {
      position: "fixed",
      inset: "auto",
      margin: "0",
      left: `${x}px`,
      top: `${y}px`,
    });
  };
  pop.addEventListener("toggle", update);
  view.addEventListener("resize", update);
  view.addEventListener("scroll", update, true);
  return () => {
    pop.removeEventListener("toggle", update);
    view.removeEventListener("resize", update);
    view.removeEventListener("scroll", update, true);
  };
}
