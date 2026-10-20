export type ToolResult = { content: { type: "text"; text: string }[] };
export type AingTool = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    consequentialHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    context: { signal: AbortSignal },
  ) => ToolResult | Promise<ToolResult>;
};
export type WebMCPProps = {
  toolName?: string;
  webmcp?: false | { name?: string; description?: string };
};
export type ToolLog = {
  id: string;
  name: string;
  input: unknown;
  output?: unknown;
  status: "running" | "success" | "error";
  durationMs?: number;
};
export type NativeTool = Omit<AingTool, "execute" | "inputSchema"> & {
  inputSchema: AingTool["inputSchema"] | string;
};
export type ModelContext = {
  registerTool: (tool: AingTool, options: { signal: AbortSignal }) => void | Promise<void>;
  getTools?: () => NativeTool[] | Promise<NativeTool[]>;
  executeTool?: (tool: NativeTool, input: string) => Promise<string>;
  ontoolchange?: ((event: Event) => void) | null;
};
declare global {
  interface Window {
    __aingTools?: Map<string, AingTool>;
    __aingToolDefinitions?: Map<string, Omit<AingTool, "execute">>;
  }
}
export const result = (value: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value) || "null" }],
});
export function toolName(
  prefix: string,
  id: string,
  props: WebMCPProps = {},
  suffix = "",
  label = "",
) {
  const slug = label
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\w-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (
    (
      props.toolName ||
      (props.webmcp && props.webmcp.name) ||
      `${prefix}_${slug || id.replace(/[^\w-]/g, "") || "control"}`
    )
      .replace(/[^\w.-]/g, "_")
      .slice(0, 128 - suffix.length) + suffix
  );
}
export const getModelContext = (): ModelContext | undefined =>
  (document as Document & { modelContext?: ModelContext }).modelContext ??
  (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
let logs: ToolLog[] = [];
export const getLogs = () => logs;
const emit = (name: string) => window.dispatchEvent(new Event(name));
export const subscribeLogs = (update: () => void) => {
  window.addEventListener("aing:log", update);
  return () => window.removeEventListener("aing:log", update);
};
async function invoke(tool: AingTool, input: Record<string, unknown>, signal: AbortSignal) {
  const id = crypto.randomUUID(),
    start = performance.now();
  const entry: ToolLog = { id, name: tool.name, input, status: "running" };
  const publish = () => {
    logs = [{ ...entry }, ...logs.filter((log) => log.id !== id)].slice(0, 50);
    emit("aing:log");
  };
  publish();
  try {
    signal.throwIfAborted();
    const output = await tool.execute(input, { signal });
    entry.output = output;
    entry.status = "success";
    return output;
  } catch (error) {
    entry.output = String(error);
    entry.status = "error";
    throw error;
  } finally {
    entry.durationMs = performance.now() - start;
    publish();
  }
}
export function registerTool(
  tool: AingTool,
  latest: () => Pick<AingTool, "execute"> | null = () => tool,
) {
  const controller = new AbortController(),
    tools = (window.__aingTools ??= new Map()),
    definitions = (window.__aingToolDefinitions ??= new Map()),
    requested = toolName("", "", { toolName: tool.name });
  let name = requested,
    count = 2;
  while (definitions.has(name) || tools.has(name)) {
    const suffix = `_${count++}`;
    name = requested.slice(0, 128 - suffix.length) + suffix;
  }
  const registered: AingTool = {
    ...tool,
    name,
    execute(input, context) {
      const current = latest(),
        signal = context?.signal
          ? AbortSignal.any([context.signal, controller.signal])
          : controller.signal;
      signal.throwIfAborted();
      const schema = registered.inputSchema;
      if (
        !current ||
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        schema.required?.some((key) => !Object.hasOwn(input, key)) ||
        (schema.additionalProperties === false &&
          Object.keys(input).some((key) => !Object.hasOwn(schema.properties, key))) ||
        (Object.entries(schema.properties) as [string, { type?: string; enum?: unknown[] }][]).some(
          ([key, rule]) =>
            Object.hasOwn(input, key) &&
            ((rule.type &&
              (rule.type === "integer"
                ? !Number.isInteger(input[key])
                : typeof input[key] !== rule.type)) ||
              (rule.enum && !rule.enum.includes(input[key]))),
        )
      )
        throw Error("Invalid input");
      return current.execute(input, { signal });
    },
  };
  definitions.set(name, { ...registered, execute: undefined } as Omit<AingTool, "execute">);
  emit("aing:tools");
  let fallback: AingTool | undefined;
  const fallbackRegister = () => {
    if (controller.signal.aborted) return;
    fallback = {
      ...registered,
      execute: (input, context) => invoke(registered, input, context?.signal ?? controller.signal),
    };
    tools.set(name, fallback);
    emit("aing:tools");
  };
  try {
    const native = getModelContext();
    if (native)
      Promise.resolve(native.registerTool(registered, { signal: controller.signal })).catch(
        fallbackRegister,
      );
    else fallbackRegister();
  } catch {
    fallbackRegister();
  }
  return () => {
    controller.abort();
    definitions.delete(name);
    if (tools.get(name) === fallback) tools.delete(name);
    emit("aing:tools");
  };
}
export async function listWebMCPTools(): Promise<AingTool[]> {
  const native = getModelContext(),
    tools = new Map(window.__aingTools);
  if (native?.getTools && native.executeTool)
    for (const tool of await native.getTools()) {
      const schema =
        typeof tool.inputSchema === "string" ? JSON.parse(tool.inputSchema) : tool.inputSchema;
      if (
        schema?.type !== "object" ||
        (schema.properties !== undefined &&
          (!schema.properties ||
            typeof schema.properties !== "object" ||
            Array.isArray(schema.properties)))
      )
        throw Error("Invalid input");
      const adapted: AingTool = {
        ...tool,
        inputSchema: { ...schema, properties: schema.properties || {} },
        annotations: tool.annotations ?? window.__aingToolDefinitions?.get(tool.name)?.annotations,
        execute: async (input) =>
          JSON.parse(await native.executeTool!(tool, JSON.stringify(input))),
      };
      tools.set(tool.name, {
        ...adapted,
        execute: (input, { signal }) => invoke(adapted, input, signal),
      });
    }
  return [...tools.values()];
}
export function subscribeWebMCPTools(update: () => void) {
  const native = getModelContext(),
    previous = native?.ontoolchange;
  const listener = (event: Event) => {
    previous?.call(native, event);
    update();
  };
  if (native) native.ontoolchange = listener;
  window.addEventListener("aing:tools", update);
  return () => {
    window.removeEventListener("aing:tools", update);
    if (native?.ontoolchange === listener) native.ontoolchange = previous;
  };
}
