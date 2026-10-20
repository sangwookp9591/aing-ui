export function announce(region: HTMLElement, message: string) {
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.textContent = message;
}
