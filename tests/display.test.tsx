import { createToolDocument } from "./tool-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../registry/aing/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../registry/aing/ui/accordion";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "../registry/aing/ui/pagination";
import { Progress } from "../registry/aing/ui/progress";
import { Badge } from "../registry/aing/ui/badge";
import { Avatar, AvatarFallback } from "../registry/aing/ui/avatar";
import { Separator } from "../registry/aing/ui/separator";
import { Skeleton } from "../registry/aing/ui/skeleton";
import { Kbd } from "../registry/aing/ui/kbd";
import type { AingTool } from "../registry/aing/lib/webmcp";
import { display } from "../lib/catalog/display";
import { readFileSync } from "node:fs";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true });
Object.defineProperty(globalThis, "requestAnimationFrame", { value: (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 0), configurable: true });
Object.defineProperty(globalThis, "cancelAnimationFrame", { value: (id: ReturnType<typeof setTimeout>) => clearTimeout(id), configurable: true });
const events = new EventTarget(), tools = new Map<string, AingTool>();
Object.defineProperty(globalThis, "window", { value: Object.assign(events, { __aingTools: tools }), configurable: true });
Object.defineProperty(globalThis, "document", { value: createToolDocument(), configurable: true });
const execute = (name: string, input: Record<string, unknown> = {}) => tools.get(name)!.execute(input, { signal: new AbortController().signal });
async function mount(element: React.ReactElement) { let root!: ReactTestRenderer; await act(async () => { root = create(element); }); return root; }
async function unmount(root: ReactTestRenderer) { await act(async () => root.unmount()); assert.equal(tools.size, 0, "등록은 언마운트에 모두 해제되어야 함"); }

test("display catalog and registry contain the same eleven complete installable components", () => {
  const registry = JSON.parse(readFileSync("registry/groups/display.json", "utf8")).items;
  assert.equal(display.length, 11);
  assert.equal(new Set(display.map(item => item.name)).size, 11);
  assert.deepEqual(registry.map((item: { name: string }) => item.name), display.map(item => item.name));
  for (const item of display) { assert.ok(item.code && item.imports && item.props.length && item.tools.length && item.demo); assert.ok(readFileSync(`registry/aing/ui/${item.name}.tsx`, "utf8").startsWith('"use client"')); }
});
test("tabs tool rejects disabled and unknown values, reads latest callback, and changes uncontrolled panel", async () => {
  let selected = "";
  const render = (callback: (value: string) => void) => <Tabs defaultValue="one" toolName="tabs_test" onValueChange={callback}><TabsList><TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Two</TabsTrigger><TabsTrigger value="locked" disabled>Locked</TabsTrigger></TabsList><TabsContent value="one">First panel</TabsContent><TabsContent value="two">Second panel</TabsContent></Tabs>;
  const root = await mount(render(value => { selected = value; }));
  const tool = tools.get("tabs_test")!;
  assert.deepEqual(tool.inputSchema.properties.value, { type: "string", enum: ["one", "two"] });
  await assert.rejects(async () => execute("tabs_test", { value: "locked" }), /탭|Invalid input/);
  await assert.rejects(async () => execute("tabs_test", { value: 1 }), /탭|Invalid input/);
  await act(async () => root.update(render(value => { selected = `latest:${value}`; })));
  assert.equal(tools.get("tabs_test"), tool);
  await act(async () => { await execute("tabs_test", { value: "two" }); });
  assert.equal(selected, "latest:two");
  assert.ok(JSON.stringify(root.toJSON()).includes("Second panel"));
  await unmount(root);
});
test("accordion supports independent multiple items and rejects disabled items", async () => {
  let values: string[] = [];
  const root = await mount(<Accordion type="multiple" toolName="accordion_test" onValueChange={next => { values = next; }}>{["a", "b", "locked"].map(value => <AccordionItem value={value} key={value} disabled={value === "locked"}><AccordionTrigger>{value}</AccordionTrigger><AccordionContent>{value} content</AccordionContent></AccordionItem>)}</Accordion>);
  await act(async () => { await execute("accordion_test_a"); });
  assert.deepEqual(values, ["a"]);
  await act(async () => { await execute("accordion_test_b"); });
  assert.deepEqual(values, ["a", "b"]);
  await act(async () => { await execute("accordion_test_a"); });
  assert.deepEqual(values, ["b"]);
  await assert.rejects(async () => execute("accordion_test_locked"), /비활성/);
  await unmount(root);
});
test("pagination rejects fractional, missing, and out-of-range pages and preserves modified link clicks", async () => {
  let current = 1;
  const root = await mount(<Pagination page={current} pageCount={5} onPageChange={page => { current = page; }} toolName="pages_test"><PaginationContent><PaginationItem><PaginationLink href="?page=2" page={2}>2</PaginationLink></PaginationItem></PaginationContent></Pagination>);
  for (const page of [0, 6, 1.5, "2", undefined, NaN, Infinity]) await assert.rejects(async () => execute("pages_test", { page }), /범위|Invalid input/);
  await act(async () => { await execute("pages_test", { page: 5 }); });
  assert.equal(current, 5);
  const anchor = root.root.findByType("a");
  anchor.props.onClick({ metaKey: true, button: 0, preventDefault() { throw new Error("modified navigation blocked"); } });
  assert.equal(current, 5);
  let prevented = false;
  await act(async () => anchor.props.onClick({ button: 0, preventDefault() { prevented = true; } }));
  assert.equal(current, 2); assert.equal(prevented, true);
  await unmount(root);
});
test("progress clamps finite values and treats invalid values as indeterminate", async () => {
  const root = await mount(<Progress toolName="progress_test" value={130} />);
  assert.deepEqual(JSON.parse((await execute("progress_test")).content[0].text), { value: 100, max: 100, indeterminate: false });
  await act(async () => root.update(<Progress toolName="progress_test" value={-5} max={0} />));
  assert.deepEqual(JSON.parse((await execute("progress_test")).content[0].text), { value: 0, max: 100, indeterminate: false });
  await act(async () => root.update(<Progress toolName="progress_test" value={NaN} />));
  assert.deepEqual(JSON.parse((await execute("progress_test")).content[0].text), { value: null, max: 100, indeterminate: true });
  await unmount(root);
});
test("display-only tools expose text read-only; decorative separator, skeleton, and opt-out register nothing", async () => {
  const root = await mount(<><Badge toolName="badge_test">Published</Badge><Avatar toolName="avatar_test" aria-label="Min Kim"><AvatarFallback>MK</AvatarFallback></Avatar><Kbd toolName="kbd_test">Esc</Kbd><Separator decorative={false} toolName="separator_test" /><Separator /><Skeleton /><Badge webmcp={false}>Private</Badge></>);
  assert.equal(tools.size, 4);
  for (const tool of tools.values()) assert.equal(tool.annotations?.readOnlyHint, true);
  assert.equal(JSON.parse((await execute("badge_test")).content[0].text).label, "Published");
  assert.equal(JSON.parse((await execute("avatar_test")).content[0].text).label, "Min Kim");
  assert.equal(JSON.parse((await execute("kbd_test")).content[0].text).shortcut, "Esc");
  await unmount(root);
});
