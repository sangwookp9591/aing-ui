import type { ComponentType } from "react";
import { ai } from "./ai";
import { forms } from "./forms";
import { overlays } from "./overlays";
import { display } from "./display";
export type CatalogItem = {
 serverComponent?: boolean; platform?: boolean;
 name: string; imports: string; title: string; ko: string; description: string;
 props: readonly (readonly string[])[]; tools: readonly (readonly string[])[]; code: string;
 demo: () => Promise<{default: ComponentType<{compact?: boolean; styling?: "css" | "tailwind"}>}>;
};
export const catalogGroups = [{id:"ai", title:"AI", items:ai}, {id:"forms", title:"Forms", items:forms}, {id:"overlays", title:"Overlays", items:overlays}, {id:"display", title:"Display & Navigation", items:display}];
export const catalog: readonly CatalogItem[] = catalogGroups.flatMap(group => [...group.items]);
export function getComponent(name: string) { return catalog.find(item => item.name === name); }
