import { renderButton, type ButtonProps } from "@aing/core/button";
export type { ButtonProps } from "@aing/core/button";
export function buttonVariants({
  variant = "default",
  size = "default",
  className = "",
}: Pick<ButtonProps, "variant" | "size" | "className"> = {}) {
  return `aing-button aing-button-${variant} aing-button-${size} ${className}`;
}
export function Button(props: ButtonProps) {
  return renderButton(props, buttonVariants(props));
}
