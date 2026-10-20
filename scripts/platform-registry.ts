import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.resolve("next/package.json"));
const postcss = require("postcss");
type CssNode = {
  type: string;
  prop: string;
  value: string;
  selector: string;
  name: string;
  params: string;
  nodes?: CssNode[];
  important?: boolean;
};
function json(nodes: CssNode[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const node of nodes) {
    if (node.type === "decl")
      result[node.prop] = node.value + (node.important ? " !important" : "");
    if (node.type === "rule" || node.type === "atrule") {
      const key =
        node.type === "rule"
          ? node.selector.replace(/\s+/g, " ")
          : `@${node.name} ${node.params}`.trim();
      result[key] = { ...(result[key] as object), ...json(node.nodes ?? []) };
    }
  }
  return result;
}
const tokens = json(postcss.parse(await readFile("registry/aing/css/tokens.css", "utf8")).nodes);
const variants: unknown[] = [];
const previewCSS: string[] = [];
for (const group of ["forms", "overlays"]) {
  const path = `registry/groups/${group}.json`,
    data = JSON.parse(await readFile(path, "utf8"));
  for (const item of data.items) {
    if (!["button", "dialog", "select"].includes(item.name)) continue;
    const styles = json(
      postcss.parse(await readFile(`registry/aing/css/${item.name}.css`, "utf8")).nodes,
    );
    item.dependencies = [process.env.AING_CORE_PACKAGE ?? "@aing/core@0.1.0"];
    item.registryDependencies = [];
    item.css = {
      "@layer aing": { ...(tokens["@layer aing"] as object), ...(styles["@layer aing"] as object) },
    };
    item.docs =
      "React >=19. Plain CSS by default; no Tailwind configuration needed. @aing/core is shared across components.";
    const platform = postcss.parse(await readFile(`registry/aing/css/${item.name}.css`, "utf8"));
    platform.walkRules((rule: CssNode & { remove: () => void }) => {
      const inStartingStyle =
        (rule as unknown as { parent: CssNode }).parent.name === "starting-style";
      if (!rule.selector.includes("::") && !inStartingStyle) rule.remove();
      else {
        if (!inStartingStyle)
          rule.selector = rule.selector
            .split(",")
            .filter((selector) => selector.includes("::"))
            .join(",");
        rule.selector = rule.selector
          .replaceAll(".aing-dialog", '[data-aing-tailwind="dialog"]')
          .replaceAll(".aing-select", '[data-aing-tailwind="select"]');
      }
    });
    platform.walkAtRules((rule: CssNode & { remove: () => void }) => {
      if (!rule.nodes?.length) rule.remove();
    });
    const platformStyles = json(platform.nodes);
    if (item.name === "dialog") {
      platformStyles["@custom-variant sheet"] = { "@media (width <= 640px)": { "@slot": {} } };
      previewCSS.push("@custom-variant sheet { @media (width <= 640px) { @slot; } }");
    }
    previewCSS.push(platform.toString());
    const theme = Object.fromEntries(
      [
        "background",
        "foreground",
        "primary",
        "primary-foreground",
        "secondary",
        "secondary-foreground",
        "muted",
        "muted-foreground",
        "border",
        "input",
        "ring",
        "destructive",
        "destructive-foreground",
      ].map((name) => [`color-${name}`, `var(--${name})`]),
    );
    variants.push({
      ...item,
      css: {
        ...Object.fromEntries(
          Object.entries(platformStyles).filter(([key]) => key !== "@layer aing"),
        ),
        "@layer aing": {
          ...(tokens["@layer aing"] as object),
          ...(platformStyles["@layer aing"] as object),
        },
      },
      cssVars: { theme },
      name: `${item.name}-tailwind`,
      title: `${item.title} · Tailwind v4`,
      files: [{ path: `registry/aing/tailwind/${item.name}.tsx`, type: "registry:ui" }],
      docs: "Tailwind v4 utilities plus shared platform state and motion rules. No plugins required.",
    });
  }
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
}
await writeFile(
  "registry/groups/platform.json",
  JSON.stringify({ items: variants }, null, 2) + "\n",
);
const aiPath = "registry/groups/ai.json",
  ai = JSON.parse(await readFile(aiPath, "utf8"));
ai.items.find((item: { name: string }) => item.name === "webmcp").dependencies = [
  process.env.AING_CORE_PACKAGE ?? "@aing/core@0.1.0",
];
await writeFile(aiPath, JSON.stringify(ai, null, 2) + "\n");

await writeFile("registry/aing/css/platform-tailwind.css", previewCSS.join("\n"));
