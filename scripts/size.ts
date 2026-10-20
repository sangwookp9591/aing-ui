import { format } from "prettier";
import { build, transform } from "esbuild";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const modules: Record<string, number> = {
  focus: 1000,
  position: 1500,
  dismiss: 600,
  motion: 1200,
  webmcp: 1500,
  id: 150,
  live: 150,
};
const rows: { name: string; gzip: number; budget: number | null; passed: boolean | null }[] = [];
async function measure(path: string, external: string[]) {
  const output = await build({
    entryPoints: [path],
    bundle: true,
    minify: true,
    write: false,
    format: "esm",
    external,
    alias: external.includes("@aing/core/*")
      ? undefined
      : { "@aing/core/react": resolve("packages/core/src/react.tsx") },
    logLevel: "silent",
  });
  return gzipSync(output.outputFiles![0].contents, { level: 9 }).length;
}
for (const [name, budget] of Object.entries(modules)) {
  const gzip = await measure(`packages/core/src/${name}.ts`, ["react", "react/*"]);
  rows.push({ name, gzip, budget, passed: gzip <= budget });
}
const renderer = await measure("packages/core/src/button.tsx", [
  "react",
  "react/*",
  "@aing/core/*",
]);
rows.push({ name: "button renderer", gzip: renderer, budget: 1000, passed: renderer <= 1000 });
rows.push({
  name: "control registration",
  gzip: await measure("packages/core/src/control.tsx", ["react", "react/*", "./webmcp.js"]),
  budget: null,
  passed: null,
});
const total = rows.reduce((n, row) => n + row.gzip, 0);
rows.push({ name: "core total (sum)", gzip: total, budget: 6000, passed: total <= 6000 });
for (const directory of ["ui", "tailwind"])
  for (const [name, budget] of Object.entries({ button: 1000, dialog: 3000, select: 6000 })) {
    const path = `registry/aing/${directory}/${name}.tsx`,
      gzip = await measure(path, ["react", "react/*", "@aing/core/*"]);
    const formatted = await format(await readFile(path, "utf8"), {
      parser: "typescript",
      printWidth: 100,
    });
    const sourceLines = formatted.trim().split("\n");
    const lines = sourceLines.length,
      limit = name === "button" ? 120 : 250;
    const tooWide = sourceLines.findIndex((line) => line.length > 100);
    if (tooWide >= 0)
      throw new Error(`${path}:${tooWide + 1}: exceeds 100 columns after formatting`);
    if (lines > limit) throw new Error(`${name}: ${lines} formatted lines > ${limit}`);
    rows.push({
      name: `${name}${directory === "tailwind" ? "-tailwind" : ""} own (${lines} lines)`,
      gzip,
      budget: null,
      passed: null,
    });
    const behavior = await measure(`packages/core/src/${name}.tsx`, [
      "react",
      "react/*",
      "./react.js",
      "@aing/core/*",
    ]);
    rows.push({
      name: `${name}${directory === "tailwind" ? "-tailwind" : ""} ${name === "button" ? "own budget" : "with behavior"}`,
      gzip: name === "button" ? gzip : gzip + behavior,
      budget,
      passed: (name === "button" ? gzip : gzip + behavior) <= budget,
    });
    rows.push({
      name: `${name}${directory === "tailwind" ? "-tailwind" : ""} with core`,
      gzip: await measure(path, ["react", "react/*"]),
      budget: null,
      passed: null,
    });
  }
for (const name of ["button", "dialog", "select"]) {
  const css = await transform(
    (await readFile("registry/aing/css/tokens.css", "utf8")) +
      (await readFile(`registry/aing/css/${name}.css`, "utf8")),
    { loader: "css", minify: true },
  );
  rows.push({
    name: `${name} CSS + tokens`,
    gzip: gzipSync(css.code, { level: 9 }).length,
    budget: null,
    passed: null,
  });
}
await mkdir(".verify", { recursive: true });
await writeFile(".verify/m1-size.json", JSON.stringify(rows, null, 2));
console.table(rows);
if (rows.some((row) => row.passed === false)) process.exitCode = 1;
