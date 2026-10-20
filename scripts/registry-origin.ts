import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
// shadcn emits an extra index; publish the installable items only.
await unlink("public/r/registry.json");
const value = process.env.AING_REGISTRY_ORIGIN;
if (value) {
  const origin = new URL(value);
  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.origin !== value.replace(/\/$/, "")
  )
    throw new Error("AING_REGISTRY_ORIGIN에는 http(s) origin만 지정하세요.");
  for (const name of await readdir("public/r")) {
    if (!name.endsWith(".json")) continue;
    const path = `public/r/${name}`;
    const item = JSON.parse(await readFile(path, "utf8"));
    if (item.registryDependencies)
      item.registryDependencies = item.registryDependencies.map((url: string) =>
        url.replace("http://localhost:3210", origin.origin),
      );
    await writeFile(path, JSON.stringify(item, null, 2) + "\n");
  }
}
