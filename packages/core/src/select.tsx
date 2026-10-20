"use client";
import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { composeRefs, useControlTool, useBaseSelect, result, type WebMCPProps } from "./react.js";
export type SelectProps = Omit<ComponentProps<"select">, "value" | "defaultValue" | "size"> &
  WebMCPProps & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    loading?: boolean;
  };

export function createSelect(styles: {
  select: string;
  frame: string;
  spinner: string;
  tailwind?: boolean;
}) {
  type NodeProps = {
    children?: ReactNode;
    value?: string;
    disabled?: boolean;
    placeholder?: string;
    label?: string;
  };
  const text = (node: ReactNode): string =>
    Children.toArray(node)
      .map((child) =>
        isValidElement<NodeProps>(child) ? text(child.props.children) : String(child),
      )
      .join("");
  function find(node: ReactNode, type: unknown): React.ReactElement<NodeProps>[] {
    return Children.toArray(node).flatMap((child) =>
      !isValidElement<NodeProps>(child)
        ? []
        : child.type === type
          ? [child]
          : find(child.props.children, type),
    );
  }
  function options(node: ReactNode, enhanced: boolean): ReactNode {
    return Children.toArray(node).map((child, key) => {
      if (!isValidElement<NodeProps>(child)) return null;
      const props = child.props;
      if (child.type === SelectItem || child.type === "option") {
        return (
          <option {...props} key={key} label={props.label ?? text(props.children)}>
            {enhanced ? Children.toArray(props.children) : text(props.children)}
          </option>
        );
      }
      if (child.type === SelectGroup || child.type === "optgroup") {
        const labels = find(props.children, SelectLabel);
        const label =
          labels.map((item) => text(item.props.children)).join("") ||
          (props as ComponentProps<"optgroup">).label ||
          "";
        return (
          <optgroup {...props} key={key} label={label}>
            {enhanced && (
              <legend
                key="label"
                className={labels
                  .map((item) => (item.props as ComponentProps<"legend">).className ?? "")
                  .join(" ")}
              >
                {label}
              </legend>
            )}
            {options(props.children, enhanced)}
          </optgroup>
        );
      }
      if (child.type === SelectSeparator) return enhanced ? <hr key={key} /> : null;
      return child.type === SelectTrigger ? null : options(props.children, enhanced);
    });
  }
  function Select({
    value,
    defaultValue = "",
    onValueChange,
    children,
    webmcp,
    toolName,
    loading = false,
    className = "",
    ref,
    onChange,
    ...props
  }: SelectProps) {
    const element = useRef<HTMLSelectElement>(null);
    const trigger = find(children, SelectTrigger)[0]?.props as
      | (Omit<ComponentProps<"select">, "size"> & { size?: "sm" | "default" })
      | undefined;
    const { size, children: _children, ...triggerProps } = trigger ?? {};
    const enhanced = useBaseSelect();
    const previousValue = useRef(defaultValue);
    useLayoutEffect(() => {
      previousValue.current = element.current!.value;
    });
    const nativeOptions = options(children, enhanced);
    const placeholder = find(children, SelectValue)[0]?.props.placeholder;
    const available = (node: ReactNode): string[] =>
      Children.toArray(node).flatMap((child) =>
        !isValidElement<NodeProps>(child) || child.props.disabled
          ? []
          : child.type === "option"
            ? [child.props.value ?? text(child.props.children)]
            : available(child.props.children),
      );
    const allowed = available(nativeOptions);
    useControlTool(
      "choose",
      { webmcp, toolName },
      () => element.current,
      onValueChange || onChange || triggerProps.onChange || (props.name && value === undefined)
        ? {
            description: `옵션을 선택합니다. ${find(nativeOptions, "option")
              .filter((option) =>
                allowed.includes(option.props.value ?? text(option.props.children)),
              )
              .map((option) => {
                const label = option.props.label ?? text(option.props.children);
                return `${option.props.value ?? text(option.props.children)} = ${label}`;
              })
              .join("; ")}`,
            inputSchema: {
              type: "object",
              properties: { value: { type: "string", enum: allowed } },
              required: ["value"],
              additionalProperties: false,
            },
            execute: ({ value: next }) => {
              const select = element.current;
              const option =
                select && Array.from(select.options).find((item) => item.value === next);
              if (
                typeof next !== "string" ||
                !allowed.includes(next) ||
                option?.disabled ||
                option?.parentElement?.matches("optgroup:disabled")
              ) {
                throw new Error("사용 가능한 옵션을 선택하세요.");
              }
              if (select) {
                Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(
                  select,
                  next,
                );
                select.dispatchEvent(new Event("change", { bubbles: true }));
              }
              return result({ value: next });
            },
          }
        : null,
    );
    return (
      <span className={styles.frame}>
        <select
          {...triggerProps}
          {...props}
          ref={composeRefs(element, ref, trigger?.ref)}
          data-slot="select-trigger"
          data-aing-tailwind={styles.tailwind ? "select" : undefined}
          data-size={size}
          aria-busy={loading}
          disabled={props.disabled || triggerProps.disabled}
          aria-disabled={loading || props["aria-disabled"] || triggerProps["aria-disabled"]}
          onClick={(event) => {
            if (loading) event.preventDefault();
            else {
              triggerProps.onClick?.(event);
              props.onClick?.(event);
            }
          }}
          onPointerDown={(event) => {
            if (loading) event.preventDefault();
            else {
              triggerProps.onPointerDown?.(event);
              props.onPointerDown?.(event);
            }
          }}
          onKeyDown={(event) => {
            if (
              loading &&
              ((event.key.length === 1 && !event.ctrlKey && !event.metaKey) ||
                [
                  "ArrowUp",
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                  "Enter",
                ].includes(event.key))
            )
              event.preventDefault();
            else {
              triggerProps.onKeyDown?.(event);
              props.onKeyDown?.(event);
            }
          }}
          className={`${styles.select} ${trigger?.className ?? ""} ${className}`}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={(event) => {
            if (loading) {
              event.currentTarget.value = value ?? previousValue.current;
              return;
            }
            previousValue.current = event.target.value;
            onValueChange?.(event.target.value);
            triggerProps.onChange?.(event);
            onChange?.(event);
          }}
        >
          {placeholder && (
            <option key="placeholder" value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {nativeOptions}
        </select>
        {loading && (
          <svg
            aria-hidden="true"
            className={styles.spinner}
            width="16"
            height="16"
            viewBox="0 0 24 24"
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
      </span>
    );
  }
  function SelectTrigger(
    _: Omit<ComponentProps<"select">, "size"> & {
      size?: "sm" | "default";
    },
  ) {
    return null;
  }
  function SelectValue(_: { placeholder?: string }) {
    return null;
  }
  function SelectContent({ children }: { children?: ReactNode }) {
    return children;
  }
  function SelectGroup(props: ComponentProps<"optgroup">) {
    return <optgroup {...props} />;
  }
  function SelectLabel(_: { children?: ReactNode; className?: string }) {
    return null;
  }
  function SelectItem(props: ComponentProps<"option">) {
    return <option {...props} />;
  }
  function SelectSeparator() {
    return <hr />;
  }
  function SelectScrollUpButton() {
    return null;
  }
  function SelectScrollDownButton() {
    return null;
  }

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
  };
}
