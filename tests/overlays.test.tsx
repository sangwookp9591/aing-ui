import { createToolDocument } from "./tool-dom";
import assert from "node:assert/strict";
import {test} from "node:test";
import {act, create, type ReactTestRenderer} from "react-test-renderer";
import {Sheet} from "../registry/aing/ui/sheet";
import {Popover} from "../registry/aing/ui/popover";
import {DropdownMenu} from "../registry/aing/ui/dropdown-menu";
import {HoverCard} from "../registry/aing/ui/hover-card";
import {Tooltip, TooltipProvider} from "../registry/aing/ui/tooltip";
import {ToastProvider, useToast} from "../registry/aing/ui/toast";
import type {AingTool} from "../registry/aing/lib/webmcp";

Object.defineProperty(globalThis,"IS_REACT_ACT_ENVIRONMENT",{value:true});
const tools = new Map<string,AingTool>();
Object.defineProperty(globalThis,"window",{value:Object.assign(new EventTarget(),{__aingTools:tools,setTimeout,clearTimeout}),configurable:true});
Object.defineProperty(globalThis,"document",{value:createToolDocument(),configurable:true});
const context = {signal:new AbortController().signal};
test("all overlay roots share current callbacks with tools, support controlled state, opt out and clean up",async () => {
 for (const Component of [Sheet,Popover,DropdownMenu,HoverCard,Tooltip]) {
  let root!: ReactTestRenderer; const changes:boolean[] = [];
  const wrap = (node:React.ReactElement) => Component === Tooltip ? <TooltipProvider>{node}</TooltipProvider> : node;
  await act(async () => {root = create(wrap(<Component label="test panel" onOpenChange={value => changes.push(value)}/>));});
  assert.equal(tools.size,2);
  await act(async () => {await tools.get("open_test_panel")!.execute({},context);});
  assert.deepEqual(changes,[true]);
  const latest:boolean[] = [];
  await act(async () => {root.update(wrap(<Component label="test panel" open onOpenChange={value => latest.push(value)}/>));});
  await act(async () => {await tools.get("close_test_panel")!.execute({},context);});
  assert.deepEqual(latest,[false]);
  assert.deepEqual(changes,[true]);
  await act(async () => {root.update(wrap(<Component label="test panel" webmcp={false}/>));});
  assert.equal(tools.size,0);
  await act(async () => {root.unmount();});
 }
});
test("toast validates tool input, bounds the stack, and dismisses by id or all", async () => {
 let store!:ReturnType<typeof useToast>; let root!:ReactTestRenderer;
 function ReadStore(){store=useToast();return null;}
 await act(async () => {root=create(<ToastProvider toolName="show"><ReadStore/></ToastProvider>);});
 const show=tools.get("show_toast")!; assert.ok(show);
 for(const input of [{title:""},{title:" ".repeat(2)},{title:"x".repeat(121)},{title:7},{title:"ok",description:"x".repeat(501)}]) await assert.rejects(async () => show.execute(input,context));
 await act(async () => {for (let i=0;i<4;i++) await show.execute({title:`Saved ${i}`},context);});
 assert.equal(store.toasts.length,3); assert.equal(store.toasts[0].title,"Saved 1");
 await act(async () => {store.dismiss(store.toasts[1].id);});
 assert.equal(store.toasts.filter(item => item.open).length,2);
 await act(async () => {store.dismiss();}); assert.equal(store.toasts.some(item => item.open),false);
 await act(async () => {root.unmount();}); assert.equal(tools.size,0);
});
