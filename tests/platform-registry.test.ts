import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("each fresh Tailwind-only registry supplies platform tokens and valid nonempty CSS keys", async () => {
  function check(rules: Record<string, unknown>) {
    for (const [key, value] of Object.entries(rules)) {
      assert.ok(!key.includes("\n"), `CSS key must be portable: ${key}`);
      if (typeof value === "object" && value) {
        if (key === "@slot") assert.deepEqual(value, {});
        else if (key.startsWith("@")) assert.ok(Object.keys(value).length, `Empty rule: ${key}`);
        check(value as Record<string, unknown>);
      }
    }
  }
  for (const name of ["button", "dialog", "select"]) {
    for (const variant of ["", "-tailwind"]) {
      const item = JSON.parse(await readFile(`public/r/${name}${variant}.json`, "utf8"));
      const tokens = item.css["@layer aing"][":root"];
      for (const token of ["--aing-chevron", "--aing-spring"])
        assert.ok(tokens[token], `${name}${variant}: ${token}`);
      if (name === "dialog" && variant === "-tailwind")
        assert.deepEqual(item.css["@custom-variant sheet"], {
          "@media (width <= 640px)": { "@slot": {} },
        });
      check(item.css);
    }
  }
});

test("platform CSS originals stay within 100 columns", async () => {
  for (const name of ["button", "dialog", "select", "tokens"]) {
    const source = await readFile(`registry/aing/css/${name}.css`, "utf8");
    source
      .split("\n")
      .forEach((line, index) =>
        assert.ok(line.length <= 100, `${name}.css:${index + 1}: ${line.length} columns`),
      );
  }
});
