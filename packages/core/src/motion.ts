export function spring({
  stiffness = 300,
  damping = 30,
  mass = 1,
  duration = 0.6,
  samples = 24,
} = {}) {
  if (
    ![stiffness, damping, mass, duration, samples].every(Number.isFinite) ||
    Math.min(stiffness, damping, mass, duration) <= 0 ||
    samples < 2 ||
    samples > 1000
  )
    throw RangeError("Invalid spring");
  samples = Math.floor(samples);
  const omega = Math.sqrt(stiffness / mass),
    zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const points = Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i * duration) / samples;
    if (!i) return 0;
    if (i === samples) return 1;
    if (zeta < 1) {
      const w = omega * Math.sqrt(1 - zeta * zeta);
      return (
        1 - Math.exp(-zeta * omega * t) * (Math.cos(w * t) + ((zeta * omega) / w) * Math.sin(w * t))
      );
    }
    if (zeta === 1) return 1 - Math.exp(-omega * t) * (1 + omega * t);
    const h = omega * Math.sqrt(zeta * zeta - 1),
      a = -zeta * omega + h,
      b = -zeta * omega - h;
    return 1 - (b * Math.exp(a * t) - a * Math.exp(b * t)) / (b - a);
  });
  return `linear(${points.map((p) => Math.round(p * 1000) / 1000).join(", ")})`;
}
export const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function play(
  element: Element,
  frames: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions = {},
  signal?: AbortSignal,
) {
  if (signal?.aborted) return null;
  const animation = element.animate(frames, {
    ...options,
    duration: reducedMotion() ? 0 : (options.duration ?? 180),
  });
  const cancel = () => animation.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  const cleanup = () => signal?.removeEventListener("abort", cancel);
  animation.finished.then(cleanup, cleanup);
  return animation;
}
