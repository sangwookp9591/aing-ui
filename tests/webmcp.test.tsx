import { createToolDocument } from "./tool-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useWebMCPTool, type AingTool } from "../registry/aing/lib/webmcp";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true });
const events = new EventTarget();
const tools = new Map<string, AingTool>();
Object.defineProperty(globalThis, "window", {
  value: Object.assign(events, { __aingTools: tools }),
  configurable: true,
});
const doc = createToolDocument();
Object.defineProperty(globalThis, "document", {
  value: doc,
  configurable: true,
});
function Harness({ tool }: { tool: AingTool | null }) {
  useWebMCPTool(tool);
  return null;
}
const tool = (value: string): AingTool => ({
  name: "test_tool",
  description: "test",
  inputSchema: { type: "object", properties: {} },
  execute: () => ({ content: [{ type: "text", text: value }] }),
});

test("fallback reads latest callback without re-registration, aborts on rename and unmount", async () => {
  let root: ReactTestRenderer;
  await act(async () => {
    root = create(<Harness tool={tool("first")} />);
  });
  const registered = tools.get("test_tool")!;
  assert.ok(registered);
  await act(async () => {
    root.update(<Harness tool={tool("latest")} />);
  });
  assert.equal(tools.get("test_tool"), registered);
  assert.equal(
    (await registered.execute({}, { signal: new AbortController().signal }))
      .content[0].text,
    "latest",
  );
  await act(async () => {
    root.update(<Harness tool={{ ...tool("renamed"), name: "renamed" }} />);
  });
  assert.equal(tools.has("test_tool"), false);
  await assert.rejects(async () =>
    registered.execute({}, { signal: new AbortController().signal }),
  );
  await act(async () => {
    root.unmount();
  });
  assert.equal(tools.size, 0);
});
test("null does not register and cancelled invocation cannot execute", async () => {
  let root: ReactTestRenderer;
  await act(async () => {
    root = create(<Harness tool={null} />);
  });
  assert.equal(tools.size, 0);
  await act(async () => {
    root.update(<Harness tool={tool("value")} />);
  });
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(async () =>
    tools.get("test_tool")!.execute({}, { signal: abort.signal }),
  );
  await act(async () => {
    root.unmount();
  });
});
test("native registration receives signal, schema changes re-register, unmount aborts", async () => {
  const registrations: { tool: AingTool; signal: AbortSignal }[] = [];
  doc.modelContext = {
    registerTool: (tool, { signal }) => {
      registrations.push({ tool, signal });
    },
  };
  let root: ReactTestRenderer;
  await act(async () => {
    root = create(<Harness tool={tool("first")} />);
  });
  await act(async () => {
    root.update(<Harness tool={tool("latest")} />);
  });
  assert.equal(registrations.length, 1);
  assert.equal(
    (
      await registrations[0].tool.execute(
        {},
        { signal: new AbortController().signal },
      )
    ).content[0].text,
    "latest",
  );
  await act(async () => {
    root.update(
      <Harness
        tool={{
          ...tool("schema"),
          inputSchema: {
            type: "object",
            properties: { emoji: { enum: ["👍"] } },
          },
        }}
      />,
    );
  });
  assert.equal(registrations.length, 2);
  assert.ok(registrations[0].signal.aborted);
  assert.equal(tools.size, 0);
  await act(async () => {
    root.unmount();
  });
  assert.ok(registrations[1].signal.aborted);
  delete doc.modelContext;
});
test("late native rejection after unmount cannot leak a fallback tool", async () => {
  let reject!: (reason: Error) => void;
  doc.modelContext = {
    registerTool: () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  };
  let root: ReactTestRenderer;
  await act(async () => {
    root = create(<Harness tool={tool("first")} />);
  });
  await act(async () => {
    root.unmount();
    reject(new Error("not available"));
  });
  assert.equal(tools.size, 0);
  delete doc.modelContext;
});

test("callback failures remain visible without unhandled rejection, empty progress cannot advance", async () => {
  const { Card } = await import("../registry/aing/ui/card");
  const { ReactionBar } = await import("../registry/aing/ui/reaction-bar");
  const { ProgressTracker } =
    await import("../registry/aing/ui/progress-tracker");
  const fail = async () => {
    throw new Error("콜백 실패");
  };
  const cases = [
    <Card
      key="card"
      webmcp={false}
      actions={[{ id: "save", label: "저장", onSelect: fail }]}
    />,
    <ReactionBar
      key="reaction"
      webmcp={false}
      reactions={[{ emoji: "👍", count: 1, active: false }]}
      onToggle={fail}
    />,
    <ProgressTracker
      key="progress"
      webmcp={false}
      steps={[{ id: "one", label: "시작", status: "active" }]}
      onAdvance={fail}
    />,
  ];
  for (const component of cases) {
    let root: ReactTestRenderer;
    await act(async () => {
      root = create(component);
    });
    await act(async () => {
      await root.root.findByType("button").props.onClick();
    });
    assert.equal(
      root!.root.findByProps({ role: "alert" }).children.join(""),
      "콜백 실패",
    );
    await act(async () => {
      root.unmount();
    });
  }
  let root: ReactTestRenderer;
  await act(async () => {
    root = create(
      <ProgressTracker
        webmcp={false}
        steps={[]}
        onAdvance={() => {
          throw new Error("실행되면 안 됨");
        }}
      />,
    );
  });
  assert.equal(root!.root.findByType("button").props.disabled, true);
  await act(async () => {
    root.unmount();
  });
});

test("consequential approval requires two keyboard confirmations, pointer click alone cannot approve, failures stay visible", async () => {
  const { ToolCall } = await import("../registry/aing/ui/tool-call");
  let calls = 0;
  let root: ReactTestRenderer;
  await act(async () => {
    root = create(<ToolCall webmcp={false} name="write" input={{ path: "card.tsx" }} status="pending" consequentialHint onApprove={() => { calls++; throw new Error("승인 실패"); }} />);
  });
  const approve = () => root!.root.findByType("button");
  await act(async () => { approve().props.onClick({ detail: 1 }); });
  assert.equal(calls, 0);
  await act(async () => { approve().props.onClick({ detail: 0 }); });
  assert.equal(calls, 0);
  await act(async () => { approve().props.onClick({ detail: 0 }); });
  assert.equal(calls, 1);
  assert.equal(root!.root.findByProps({ role: "alert" }).children.join(""), "승인 실패");
  await act(async () => { root.unmount(); });
});

test("ordinary Card preserves caller styles on pointer leave", async () => {
  const { Card } = await import("../registry/aing/ui/card");
  let root: ReactTestRenderer;
  await act(async () => { root = create(<Card webmcp={false} style={{ backgroundImage: "linear-gradient(red, blue)", borderColor: "red" }} />); });
  const style = { backgroundImage: "linear-gradient(red, blue)", borderColor: "red" };
  root!.root.findByType("section").props.onPointerLeave({ currentTarget: { style } });
  assert.deepEqual(style, { backgroundImage: "linear-gradient(red, blue)", borderColor: "red" });
  await act(async () => { root.unmount(); });
});

test("duplicate tools receive suffixes on fallback and native with independent callbacks and cleanup", async () => {
 for(const native of [false,true]) {
  const registrations: AingTool[]=[];
  if(native)doc.modelContext={registerTool:entry=>{registrations.push(entry);}};
  let root:ReactTestRenderer;
  await act(async()=>{root=create(<><Harness tool={tool("first")}/><Harness tool={tool("second")}/><Harness tool={tool("third")}/></>);});
  const entries=native?registrations:[...tools.values()];
  assert.deepEqual(entries.map(entry=>entry.name),["test_tool","test_tool_2","test_tool_3"]);
  for(const [index,entry] of entries.entries())assert.equal((await entry.execute({},{signal:new AbortController().signal})).content[0].text,["first","second","third"][index]);
  await act(async()=>{root.unmount();});assert.equal(tools.size,0);delete doc.modelContext;
 }
});
