import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { act, type Ref } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../registry/aing/ui/button";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectGroup,
} from "../registry/aing/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  AlertDialogAction,
} from "../registry/aing/ui/dialog";
import { AingTool } from "../packages/core/src/webmcp";
const browser = new Window();
for (const name of [
  "window",
  "document",
  "navigator",
  "MutationObserver",
  "HTMLElement",
  "HTMLSelectElement",
  "HTMLButtonElement",
  "Event",
  "CSS",
]) {
  Object.defineProperty(globalThis, name, {
    value: name === "window" ? browser : (browser as unknown as Record<string, unknown>)[name],
    configurable: true,
  });
}
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true });
Object.defineProperty(browser.HTMLElement.prototype, "getClientRects", { value: () => [1] });
Object.defineProperty(globalThis, "getComputedStyle", {
  value: (el: Element) => {
    const style = browser.getComputedStyle(el as never);
    return { visibility: style.visibility || "visible" };
  },
  configurable: true,
});
Object.defineProperty(globalThis, "CSS", { value: { supports: () => true }, configurable: true });
const tools = () => window.__aingTools ?? new Map<string, AingTool>();
const settle = () =>
  act(async () => {
    await new Promise((done) => setTimeout(done, 0));
  });
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  return {
    root,
    host,
    async dispose() {
      await act(() => root.unmount());
      host.remove();
    },
  };
}
const signal = new AbortController().signal;
test("Button only registers named actions; loading preserves focus and blocks clicks; state and unmount unregister", async () => {
  const { root, host, dispose } = mount();
  let count = 0;
  const render = (loading = false, disabled = false) => (
    <>
      <Button>Decorative</Button>
      <Button onClick={() => count++} />
      <Button toolName="save" onClick={() => count++} loading={loading} disabled={disabled}>
        Save
      </Button>
    </>
  );
  await act(() => root.render(render()));
  assert.deepEqual([...tools().keys()], ["save"]);
  const button = host.querySelectorAll("button")[2];
  button.focus();
  await act(() => root.render(render(true)));
  assert.equal(document.activeElement, button);
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Save");
  assert.equal(tools().size, 0);
  button.click();
  assert.equal(count, 0);
  await act(() => root.render(render()));
  await tools().get("save")!.execute({}, { signal });
  assert.equal(count, 1);
  host.hidden = true;
  await settle();
  assert.equal(tools().size, 0);
  host.hidden = false;
  await settle();
  assert.equal(tools().size, 1);
  await act(() => root.render(render(false, true)));
  assert.equal(tools().size, 0);
  await dispose();
  assert.equal(tools().size, 0);
});
test("associated labels name Select tools, disabled groups are absent, loading unregisters, rich children survive", async () => {
  const { root, host, dispose } = mount();
  let value = "";
  const render = (loading = false) => (
    <>
      <label htmlFor="region">기본 지역</label>
      <Select onValueChange={(next) => (value = next)} loading={loading}>
        <SelectTrigger id="region">
          <SelectValue placeholder="지역 선택" />
        </SelectTrigger>
        <SelectItem value="one">
          <span aria-hidden="true">🌏 </span>Seoul
        </SelectItem>
        <SelectItem value="two" disabled>
          Tokyo
        </SelectItem>
        <SelectGroup disabled>
          <SelectItem value="three">Sydney</SelectItem>
        </SelectGroup>
      </Select>
    </>
  );
  const keyWarnings: string[] = [],
    originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (args.map(String).join(" ").includes('unique "key"'))
      keyWarnings.push(args.map(String).join(" "));
    originalError(...args);
  };
  try {
    await act(() => root.render(render()));
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(keyWarnings, []);
  assert.equal(tools().size, 1);
  const tool = [...tools().values()][0];
  assert.ok(tool.description.includes("기본 지역"));
  assert.ok(tool.description.includes("one = 🌏 Seoul"));
  assert.equal(tool.name, "choose_select");
  assert.deepEqual(tool.inputSchema.properties.value, { type: "string", enum: ["one"] });
  assert.ok(host.querySelector("option span"));
  await act(async () => {
    await tool.execute({ value: "one" }, { signal });
  });
  assert.equal(value, "one");
  await assert.rejects(async () => tool.execute({ value: "three" }, { signal }));
  await act(() => root.render(render(true)));
  assert.equal(tools().size, 0);
  await dispose();
  assert.equal(tools().size, 0);
});
test("Dialog tools follow actual trigger/panel visibility; descriptions are conditional and close labels translate", async () => {
  const { root, host, dispose } = mount();
  const changes: boolean[] = [];
  const render = (open = false) => (
    <Dialog toolName="preferences" open={open} onOpenChange={(next) => changes.push(next)}>
      <DialogTrigger>Preferences</DialogTrigger>
      <DialogContent closeLabel="Close preferences">
        <DialogTitle>Settings</DialogTitle>
        <AlertDialogAction>Delete</AlertDialogAction>
      </DialogContent>
    </Dialog>
  );
  await act(() => root.render(render()));
  assert.ok(tools().has("preferences_open"));
  assert.equal(tools().has("preferences_close"), false);
  await act(async () => {
    await tools().get("preferences_open")!.execute({}, { signal });
  });
  assert.deepEqual(changes, [true]);
  await act(() => root.render(render(true)));
  await settle();
  assert.ok(tools().has("preferences_close"));
  assert.equal(tools().has("preferences_open"), false);
  assert.equal(host.querySelector("dialog")!.hasAttribute("aria-describedby"), false);
  assert.ok(host.querySelector('[aria-label="Close preferences"]'));
  const confirm = [...tools().values()].find((tool) => tool.description.startsWith("Delete:"))!;
  assert.equal(confirm.annotations?.consequentialHint, true);
  await dispose();
  assert.equal(tools().size, 0);
});

test("Select SSR emits text-only options and omits separators before enhancement", async () => {
  const { renderToString } = await import("react-dom/server");
  const { SelectSeparator } = await import("../registry/aing/ui/select");
  const html = renderToString(
    <Select aria-label="Region">
      <SelectGroup label="Asia">
        <SelectItem value="one">
          <span aria-hidden="true">🌏</span> Seoul
        </SelectItem>
        <SelectSeparator />
        <SelectItem value="two">Tokyo</SelectItem>
      </SelectGroup>
    </Select>,
  );
  assert.equal(html.includes("<hr"), false);
  assert.equal(/<option[^>]*>[\s\S]*?<span/.test(html), false);
  assert.ok(html.includes("🌏 Seoul"));
});
test("explicit WebMCP dialog names retain open and close suffixes", async () => {
  const { observeControl } = await import("../packages/core/src/control");
  const button = document.createElement("button");
  button.textContent = "Preferences";
  document.body.append(button);
  const tool = {
    description: "Open",
    inputSchema: { type: "object" as const, properties: {} },
    execute: () => ({ content: [] }),
  };
  const stop = observeControl(
    "open",
    { webmcp: { name: "preferences" } },
    () => button,
    tool,
    () => tool,
  );
  assert.ok(tools().has("preferences_open"));
  stop();
  button.remove();
  assert.equal(tools().size, 0);
});

test("inert unregisters controls and a retained execution is rejected before observer delivery", async () => {
  const { root, host, dispose } = mount();
  let count = 0;
  await act(() =>
    root.render(
      <Button toolName="guarded" onClick={() => count++}>
        Save
      </Button>,
    ),
  );
  const retained = tools().get("guarded")!;
  host.setAttribute("inert", "");
  await assert.rejects(async () => retained.execute({}, { signal }), /inert/);
  await settle();
  assert.equal(tools().size, 0);
  assert.equal(count, 0);
  host.removeAttribute("inert");
  await settle();
  await act(async () => {
    await tools().get("guarded")!.execute({}, { signal });
  });
  assert.equal(count, 1);
  await dispose();
});

test("direct app tools share modal/inert guards on native and fallback, with explicit modal opt-in", async () => {
  const { useWebMCPTool } = await import("@aing/core/react");
  const { result } = await import("../packages/core/src/webmcp");
  for (const native of [false, true]) {
    const nativeTools = new Map<string, AingTool>();
    const doc = document as Document & {
      modelContext?: import("../packages/core/src/webmcp").ModelContext;
    };
    if (native)
      doc.modelContext = {
        registerTool(tool, { signal }) {
          nativeTools.set(tool.name, tool);
          signal.addEventListener("abort", () => nativeTools.delete(tool.name), { once: true });
        },
      };
    const entries = () => (native ? nativeTools : tools());
    const { root, host, dispose } = mount();
    const modal = document.createElement("dialog"),
      inside = document.createElement("button");
    modal.append(inside);
    document.body.append(modal);
    // Happy DOM supplies dialog.open but does not implement :modal.
    const query = document.querySelector.bind(document);
    document.querySelector = ((selector: string) =>
      selector === "dialog:modal"
        ? modal.open
          ? modal
          : null
        : query(selector)) as typeof document.querySelector;
    let calls = 0;
    function Direct({
      name,
      target,
      allowWhileModal,
    }: {
      name: string;
      target?: () => HTMLElement | null;
      allowWhileModal?: boolean;
    }) {
      useWebMCPTool(
        {
          name,
          description: name,
          inputSchema: { type: "object", properties: {} },
          execute: () => {
            calls++;
            return result({ calls });
          },
        },
        { target, allowWhileModal },
      );
      return null;
    }
    try {
      await act(() =>
        root.render(
          <>
            <Direct name="global_app" />
            <Direct name="outside_app" target={() => host} />
            <Direct name="inside_app" target={() => inside} />
            <Direct name="persistent_app" target={() => host} allowWhileModal />
          </>,
        ),
      );
      const retained = entries().get("global_app")!,
        outside = entries().get("outside_app")!;
      modal.showModal();
      await assert.rejects(async () => retained.execute({}, { signal }), /modal/);
      await assert.rejects(async () => outside.execute({}, { signal }), /modal/);
      await settle();
      assert.deepEqual([...entries().keys()].sort(), ["inside_app", "persistent_app"]);
      await entries().get("inside_app")!.execute({}, { signal });
      const persistent = entries().get("persistent_app")!;
      await persistent.execute({}, { signal });
      assert.equal(calls, 2);
      host.setAttribute("inert", "");
      await assert.rejects(async () => persistent.execute({}, { signal }), /inert/);
      await settle();
      assert.equal(entries().has("persistent_app"), false);
      host.removeAttribute("inert");
      modal.close();
      await settle();
      assert.ok(entries().has("global_app"));
      assert.ok(entries().has("outside_app"));
      assert.equal(entries().has("inside_app"), false);
      await act(() => root.render(<Direct name="global_app" target={() => inside} />));
      assert.equal(entries().size, 0, "retargeting to a closed dialog must unregister immediately");
    } finally {
      await dispose();
      modal.remove();
      document.querySelector = query;
      delete doc.modelContext;
    }
    assert.equal(entries().size, 0);
  }
});

test("Select loading stays focusable, exposes busy, rejects changes and preserves SelectLabel classes", async () => {
  const { SelectLabel } = await import("../registry/aing/ui/select");
  const { root, host, dispose } = mount();
  let calls = 0;
  const render = (loading: boolean) => (
    <Select aria-label="지역" loading={loading} defaultValue="one" onValueChange={() => calls++}>
      <SelectGroup>
        <SelectLabel className="custom-label">Asia</SelectLabel>
        <SelectItem value="one">Seoul</SelectItem>
        <SelectItem value="two">Tokyo</SelectItem>
      </SelectGroup>
    </Select>
  );
  await act(() => root.render(render(false)));
  const select = host.querySelector("select")!;
  select.focus();
  const retained = [...tools().values()][0];
  await act(() => root.render(render(true)));
  assert.equal(document.activeElement, select);
  assert.equal(select.disabled, false);
  assert.equal(select.getAttribute("aria-disabled"), "true");
  assert.equal(select.getAttribute("aria-busy"), "true");
  assert.equal(host.querySelector("legend")!.className, "custom-label");
  const pointer = new Event("pointerdown", { bubbles: true, cancelable: true });
  select.dispatchEvent(pointer);
  assert.equal(pointer.defaultPrevented, true);
  for (const key of ["Tab", "Escape", "ArrowDown"]) {
    const event = new browser.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    select.dispatchEvent(event as unknown as Event);
    assert.equal(event.defaultPrevented, key === "ArrowDown");
  }
  select.value = "two";
  await act(() => select.dispatchEvent(new Event("change", { bubbles: true })));
  assert.equal(select.value, "one");
  assert.equal(calls, 0);
  await assert.rejects(async () => retained.execute({ value: "two" }, { signal }));
  assert.equal(tools().size, 0);
  await act(() => root.render(render(false)));
  await act(async () => {
    await [...tools().values()][0].execute({ value: "two" }, { signal });
  });
  assert.equal(calls, 1);
  await dispose();
});

test("Korean Button labels use semantic name, value and associated form names", async () => {
  const { root, dispose } = mount();
  await act(() =>
    root.render(
      <form id="workspace_form">
        <Button variant="destructive" name="save_workspace" onClick={() => {}}>
          저장
        </Button>
        <Button name="초기화" value="reset_workspace" onClick={() => {}}>
          초기화
        </Button>
        <Button type="submit">적용</Button>
      </form>,
    ),
  );
  assert.deepEqual(
    [...tools().keys()],
    ["click_save_workspace", "click_reset_workspace", "click_workspace_form"],
  );
  assert.equal(tools().get("click_save_workspace")!.annotations?.consequentialHint, true);
  await dispose();
});

test("Button action registration follows the effective merged type", async () => {
  const { root, dispose } = mount();
  await act(() =>
    root.render(
      <>
        <Button type="button" render={<button type="submit">저장</button>} />
      </>,
    ),
  );
  assert.equal(tools().size, 0);
  await dispose();
});

test("destructive Dialog triggers inherit consequential hints, Alert opening does not", async () => {
  const { AlertDialog } = await import("../registry/aing/ui/dialog");
  const { root, dispose } = mount();
  for (const alert of [false, true]) {
    const Root = alert ? AlertDialog : Dialog;
    await act(() =>
      root.render(
        <Root toolName="delete_settings">
          <DialogTrigger asChild>
            <Button variant="destructive">삭제 설정</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>삭제 설정</DialogTitle>
          </DialogContent>
        </Root>,
      ),
    );
    assert.equal(tools().get("delete_settings_open")!.annotations?.consequentialHint, !alert);
  }
  await dispose();
});

test("Button merged refs preserve React cleanup and ignore accidental callback return values", async () => {
  for (const returnsCleanup of [true, false]) {
    const { root, dispose } = mount();
    const object = { current: null as HTMLButtonElement | null };
    let cleaned = 0;
    const seen: (HTMLButtonElement | null)[] = [];
    const callback = ((node: HTMLButtonElement | null) => {
      seen.push(node);
      return returnsCleanup
        ? () => {
            cleaned++;
          }
        : seen.length;
    }) as unknown as Ref<HTMLButtonElement>;
    await act(() =>
      root.render(<Button ref={object} render={<button ref={callback}>설정</button>} />),
    );
    assert.ok(object.current);
    await dispose();
    assert.equal(object.current, null);
    assert.equal(cleaned, returnsCleanup ? 1 : 0);
    assert.equal(seen.length, returnsCleanup ? 1 : 2);
  }
});

test("uncontrolled native Dialog toggle and close notify one state change per action", async () => {
  const { root, host, dispose } = mount();
  const changes: boolean[] = [];
  await act(() =>
    root.render(
      <Dialog onOpenChange={(open) => changes.push(open)}>
        <DialogTrigger>설정 열기</DialogTrigger>
        <DialogContent>
          <DialogTitle>설정</DialogTitle>
        </DialogContent>
      </Dialog>,
    ),
  );
  const dialog = host.querySelector("dialog")!;
  const toggle = (newState: string) => Object.assign(new Event("toggle"), { newState });
  await act(() => {
    dialog.showModal();
    dialog.dispatchEvent(toggle("open"));
  });
  assert.deepEqual(changes, [true]);
  await act(() => {
    dialog.close();
  });
  await act(() => dialog.dispatchEvent(toggle("closed")));
  assert.deepEqual(changes, [true, false]);
  await dispose();
});

test("revoking allowWhileModal aborts retained app tools before another layout effect can invoke", async () => {
  const { useWebMCPTool } = await import("@aing/core/react");
  const { useLayoutEffect } = await import("react");
  const { root, host, dispose } = mount();
  const modal = document.createElement("dialog");
  document.body.append(modal);
  modal.showModal();
  const query = document.querySelector.bind(document);
  document.querySelector = ((selector: string) =>
    selector === "dialog:modal" && modal.open
      ? modal
      : query(selector)) as typeof document.querySelector;
  let calls = 0,
    retained: AingTool,
    attempt: Promise<string>;
  function Direct({ allow }: { allow: boolean }) {
    useWebMCPTool(
      {
        name: "permission",
        description: "permission",
        inputSchema: { type: "object", properties: {} },
        execute: () => {
          calls++;
          return { content: [] };
        },
      },
      { target: () => host, allowWhileModal: allow },
    );
    useLayoutEffect(() => {
      if (!allow)
        attempt = (async () => {
          try {
            await retained.execute({}, { signal });
            return "allowed";
          } catch (error) {
            return String(error);
          }
        })();
    }, [allow]);
    return null;
  }
  try {
    await act(() => root.render(<Direct allow />));
    retained = tools().get("permission")!;
    assert.ok(retained);
    await act(() => root.render(<Direct allow={false} />));
    assert.notEqual(await attempt!, "allowed");
    assert.equal(calls, 0);
    assert.equal(tools().size, 0);
  } finally {
    await dispose();
    modal.remove();
    document.querySelector = query;
  }
});
