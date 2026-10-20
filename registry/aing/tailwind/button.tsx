import { renderButton, type ButtonProps } from "@aing/core/button";
export type { ButtonProps } from "@aing/core/button";
export function buttonVariants({
  variant = "default",
  size = "default",
  className = "",
}: Pick<ButtonProps, "variant" | "size" | "className"> = {}) {
  const variants = {
    default: `bg-primary text-primary-foreground
      not-aria-disabled:hover:bg-[color-mix(in_srgb,var(--primary)_88%,var(--background))]`,
    secondary: `bg-secondary text-secondary-foreground
      not-aria-disabled:hover:bg-[color-mix(in_srgb,var(--secondary)_90%,var(--foreground))]`,
    outline: "border-border bg-background text-foreground not-aria-disabled:hover:bg-muted",
    ghost: "bg-transparent text-foreground shadow-none not-aria-disabled:hover:bg-muted",
    destructive: `bg-destructive text-destructive-foreground
      not-aria-disabled:hover:bg-[color-mix(in_srgb,var(--destructive)_88%,var(--background))]`,
    link: `bg-transparent text-foreground shadow-none underline-offset-4
      not-aria-disabled:hover:underline`,
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    default: "h-9 px-4",
    lg: "h-10 px-6",
    icon: "size-9 p-0",
  };
  return [
    `relative inline-flex items-center justify-center gap-2 rounded-md border
      [:where(&)]:border-transparent`,
    `[:where(&)]:text-sm font-medium leading-5 whitespace-nowrap [:where(&)]:shadow-xs
      touch-manipulation`,
    "transition-[translate,scale,background-color,color] duration-160 ease-[var(--aing-spring)]",
    `before:absolute before:inset-[min(0px,calc((100%-44px)/2))] before:min-h-11
      before:min-w-11`,
    "focus-visible:outline-3 focus-visible:outline-ring/50 focus-visible:outline-offset-0",
    `focus-visible:[box-shadow:none] disabled:opacity-45 disabled:cursor-not-allowed
      [&[aria-disabled=true]:not([data-loading])]:opacity-45`,
    "aria-disabled:cursor-not-allowed data-loading:cursor-progress data-loading:opacity-100",
    `not-aria-disabled:active:scale-97 motion-reduce:transition-none
      aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20`,
    "[&_.aing-spinner]:animate-spin [&_.aing-spinner]:motion-reduce:animate-none",
    variant !== "ghost" && variant !== "link"
      ? "[@media(hover:hover)]:not-aria-disabled:hover:-translate-y-px"
      : "",
    variants[variant],
    sizes[size],
    className,
  ].join(" ");
}
export function Button(props: ButtonProps) {
  return renderButton(props, buttonVariants(props));
}
