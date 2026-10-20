import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type Ref,
  type ReactElement,
} from "react";
import { AingTool, type WebMCPProps } from "@aing/core/react";
type RenderProps = ComponentProps<"button"> & { href?: string };
export type ButtonProps = ComponentProps<"button"> &
  WebMCPProps & {
    variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
    size?: "sm" | "default" | "lg" | "icon";
    loading?: boolean;
    asChild?: boolean;
    render?: ReactElement<RenderProps>;
    consequential?: boolean;
  };
function mergeRefs<T>(...refs: Exclude<Ref<T>, null>[]) {
  return (node: T | null) => {
    const cleanups = refs.map((ref) => {
      const update =
        typeof ref === "function"
          ? ref
          : (value: T | null) => {
              ref.current = value;
            };
      const cleanup = update(node);
      return () => (typeof cleanup === "function" ? cleanup() : update(null));
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  };
}
export function renderButton(
  {
    variant = "default",

    loading = false,
    asChild,
    render,
    consequential,
    webmcp,
    toolName,

    children,
    disabled,
    ...props
  }: ButtonProps,
  classes: string,
) {
  const child = render ?? (asChild && isValidElement<RenderProps>(children) ? children : null);
  const childProps = child?.props;
  disabled ??= childProps?.disabled;
  const onClick = props.onClick ?? childProps?.onClick;
  const shared: RenderProps & { "data-loading"?: boolean; "data-aing-consequential"?: boolean } = {
    ...props,
    className: classes,
    "aria-busy": loading || undefined,
    "aria-disabled": disabled || loading || undefined,
    "data-loading": loading || undefined,
    "data-aing-consequential": consequential || variant === "destructive" || undefined,
    disabled,
    ...(onClick && {
      onClick: (event) => {
        if (disabled || loading) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        childProps?.onClick?.(event);
        if (!event.defaultPrevented && props.onClick !== childProps?.onClick)
          props.onClick?.(event);
      },
    }),
  };
  const content = (
    <>
      {loading && (
        <svg
          aria-hidden="true"
          className="aing-spinner animate-spin motion-reduce:animate-none"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeDasharray="40 17"
          />
        </svg>
      )}
      {childProps?.children ?? children}
    </>
  );
  const body = child ? (
    cloneElement(
      child,
      {
        ...shared,
        ref:
          props.ref && childProps!.ref
            ? mergeRefs(props.ref, childProps!.ref)
            : (props.ref ?? childProps!.ref),
        className: `${shared.className} ${childProps!.className ?? ""}`,
        ...(disabled && { href: undefined, tabIndex: -1 }),
      },
      content,
    )
  ) : (
    <button {...shared} type={props.type ?? "button"}>
      {content}
    </button>
  );
  const actionable = !!(
    onClick ||
    (props.type ?? childProps?.type) === "submit" ||
    (props.command ?? childProps?.command) ||
    childProps?.href
  );
  return (
    <>
      {body}
      {((actionable && webmcp !== false) || loading) && (
        <AingTool {...{ webmcp, toolName, consequential, actionable }} />
      )}
    </>
  );
}
