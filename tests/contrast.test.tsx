import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
function luminance(hex: string) {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
test("actual light and dark CSS tokens meet AA for body, secondary text and controls", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const parse = (selector: string) =>
    Object.fromEntries(
      [
        ...css
          .match(new RegExp(`${selector} \\{([^}]+)`))![1]
          .matchAll(/--([\w-]+):\s*(#[a-f\d]+)/gi),
      ].map((m) => [
        m[1],
        m[2].length === 4
          ? "#" +
            m[2]
              .slice(1)
              .split("")
              .map((c) => c + c)
              .join("")
          : m[2],
      ]),
    );
  const light = parse(":root");
  for (const tokens of [light, { ...light, ...parse("\\.dark") }]) {
    for (const foreground of ["foreground", "muted-foreground"])
      for (const background of ["background", "card", "muted"])
        assert.ok(
          contrast(tokens[foreground], tokens[background]) >= 4.5,
          `${foreground}/${background}`,
        );
    assert.ok(contrast(tokens["primary-foreground"], tokens["primary"]) >= 4.5);
    for (const background of ["background", "card", "muted"]) {
      const channels = (hex: string) =>
        hex
          .slice(1)
          .match(/../g)!
          .map((c) => parseInt(c, 16));
      const base = channels(tokens[background]);
      const blended =
        "#" +
        channels(tokens.ring)
          .map((c, i) =>
            Math.round((c + base[i]) / 2)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");
      assert.ok(contrast(blended, tokens[background]) >= 3, `ring/50% on ${background}`);
    }
  }
});
