import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const items = (await Promise.all(["ai", "forms", "overlays", "display", "platform"].map(async group => JSON.parse(await readFile(`registry/groups/${group}.json`, "utf8")).items))).flat();
assert.equal(new Set(items.map(item => item.name)).size, items.length, "Duplicate registry names");
await writeFile("registry.json", JSON.stringify({$schema:"https://ui.shadcn.com/schema/registry.json", name:"aing-ui", homepage:"http://localhost:3210", items}, null, 2) + "\n");
