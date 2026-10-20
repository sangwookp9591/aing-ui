"use client";
import { Children, isValidElement, type ReactNode } from "react";
export * from "@aing/core/webmcp";
export { useWebMCPTool, useWebMCPToolLog } from "@aing/core/react";

export function accessibleText(value: ReactNode): string {
 return Children.toArray(value).map(child => typeof child === "string" || typeof child === "number" ? String(child) : isValidElement<{children?: ReactNode}>(child) ? accessibleText(child.props.children) : "").join(" ").replace(/\s+/g, " ").trim();
}

export function optionValues(children: ReactNode): string[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: unknown; disabled?: boolean; children?: ReactNode }>(child)) return [];
    return typeof child.props.value === "string" && !child.props.disabled ? [child.props.value] : optionValues(child.props.children);
  });
}
