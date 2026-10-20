import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test.use({ deviceScaleFactor: 2 });
async function prepare(page: Page, styling: string, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/m1");
  if (styling === "tailwind") await page.getByRole("radio", { name: "Tailwind v4" }).check();
  await expect
    .poll(() => page.evaluate(() => window.__aingToolDefinitions?.has("m1_dialog_open")))
    .toBe(true);
}
for (const styling of ["css", "tailwind"])
  for (const width of [1440, 375])
    test(`G2 G3 · fix3 ${styling} ${width} opens once and keeps safe area and Alert action hints`, async ({
      page,
      browserName,
    }) => {
      const warnings: string[] = [];
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type())) warnings.push(message.text());
      });
      const cdp = browserName === "chromium" ? await page.context().newCDPSession(page) : null;
      if (cdp) {
        await cdp.send("Log.enable");
        cdp.on("Log.entryAdded", ({ entry }) => {
          if (["warning", "error"].includes(entry.level)) warnings.push(entry.text);
        });
        if (width === 375)
          await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { bottom: 34 } });
      }
      await prepare(page, styling, width);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (let i = 0; i < 2; i++) {
        await page.getByRole("button", { name: "설정 열기", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "작업 공간 설정", exact: true });
        await expect(dialog).toBeVisible();
        const padding = await dialog.evaluate((element) => getComputedStyle(element).paddingBottom);
        expect(padding).toBe(width === 375 && cdp ? "50px" : "24px");
        await page.keyboard.press("Escape");
        await expect(dialog).not.toBeVisible();
      }
      const trigger = await page.evaluate(() =>
        [...window.__aingToolDefinitions!.values()].find((tool) => tool.name === "open_dialog"),
      );
      expect(trigger?.annotations?.consequentialHint).toBe(false);
      await page.getByRole("button", { name: "작업 공간 삭제", exact: true }).click();
      const alert = page.getByRole("alertdialog");
      await expect(alert).toBeVisible();
      await expect(page.getByRole("button", { name: "유지하기" })).toBeFocused();
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...window.__aingToolDefinitions!.values()].some(
              (tool) =>
                tool.description.startsWith("삭제하기:") && tool.annotations?.consequentialHint,
            ),
          ),
        )
        .toBe(true);
      await page.getByRole("button", { name: "삭제하기", exact: true }).click();
      await expect(alert).not.toBeVisible();
      expect(warnings).toEqual([]);
      await mkdir(".verify/fix3/dialog", { recursive: true });
      await writeFile(
        `.verify/fix3/dialog/${browserName}-${styling}-${width}-warnings.json`,
        JSON.stringify({ warnings, padding: width === 375 && cdp ? 50 : 24, trigger }, null, 2),
      );
    });

for (const styling of ["css", "tailwind"])
  test(`G2 G3 · fix3 ${styling} Select pointer highlight, loading Tab and Button regression`, async ({
    page,
    browserName,
  }) => {
    await prepare(page, styling);
    const select = page.locator("#m1-region");
    if (browserName === "chromium") {
      await select.click();
      const option = select.locator('option[value="tokyo"]');
      await option.hover();
      const highlighted = () =>
        select
          .locator("option")
          .evaluateAll((options) =>
            options
              .filter(
                (option) =>
                  !["transparent", "rgba(0, 0, 0, 0)"].includes(
                    getComputedStyle(option).backgroundColor,
                  ),
              )
              .map((option) => option.getAttribute("value")),
          );
      await expect.poll(highlighted).toEqual(["tokyo"]);
      await page.keyboard.press("Escape");
      await select.focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      await select.locator('option[value="seoul"]').hover();
      await expect.poll(highlighted).toEqual(["seoul"]);
      await page.keyboard.press("Escape");
    }
    const loading = page.getByRole("combobox", { name: "Loading", exact: true });
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(loading).toHaveAttribute("aria-disabled", "true");
    expect(await loading.evaluate((element) => (element as HTMLSelectElement).disabled)).toBe(
      false,
    );
    await page.getByRole("combobox", { name: "Empty", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(loading).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await expect(loading).toHaveValue("one");
    expect(await loading.evaluate((element) => element.matches(":open"))).toBe(false);
    const button = page
      .getByTestId("buttons")
      .getByRole("button", { name: "default", exact: true });
    await button.hover();
    await page.mouse.down();
    await expect
      .poll(() => button.evaluate((element) => getComputedStyle(element).scale))
      .toBe("0.97");
    expect(await button.evaluate((element) => getComputedStyle(element).translate)).toBe(
      "0px -1px",
    );
    await page.mouse.up();
    await page.getByRole("button", { name: "변경사항 저장 · Save changes", exact: true }).click();
    await expect(page.getByTestId("save-status")).toHaveText("1회 저장");
    const invalid = page.getByRole("button", { name: "다시 시도", exact: true });
    expect(await invalid.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
      "none",
    );
    await mkdir(".verify/fix3/select", { recursive: true });
    await select.screenshot({
      path: `.verify/fix3/select/${browserName}-${styling}-trigger-2x.png`,
    });
    await loading
      .locator("..")
      .screenshot({ path: `.verify/fix3/select/${browserName}-${styling}-loading-2x.png` });
  });

test("G4 · fix3 Chromium Dialog frame parity at desktop and sheet widths", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "WAAPI discrete transitions are a Chromium enhancement");
  const results: Record<string, unknown> = {};
  for (const width of [1440, 375]) {
    const variants: Record<string, { enter: number[][]; exit: number[][] }> = {};
    for (const styling of ["css", "tailwind"]) {
      await prepare(page, styling, width);
      const frames = await page.evaluate(async () => {
        const trigger = [...document.querySelectorAll("button")].find(
          (button) => button.textContent === "설정 열기",
        )!;
        const dialog = document.getElementById(
          trigger.getAttribute("commandfor")!,
        ) as HTMLDialogElement;
        async function sample(open: boolean) {
          getComputedStyle(dialog).getPropertyValue("opacity");
          if (open) trigger.click();
          else dialog.close();
          await new Promise(requestAnimationFrame);
          getComputedStyle(dialog).getPropertyValue("opacity");
          const animations = dialog.getAnimations({ subtree: true });
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = 0;
          }
          const samples: number[][] = [];
          for (const time of [0, 40, 80, 120, 149, open ? 220 : 150]) {
            for (const animation of animations) animation.currentTime = time;
            const style = getComputedStyle(dialog),
              box = dialog.getBoundingClientRect();
            samples.push([
              time,
              Number(style.opacity),
              Number(getComputedStyle(dialog, "::backdrop").opacity),
              box.y,
              box.width,
            ]);
          }
          for (const animation of animations) animation.finish();
          await new Promise(requestAnimationFrame);
          return samples;
        }
        const enter = await sample(true),
          exit = await sample(false);
        return { enter, exit };
      });
      variants[styling] = frames;
    }
    for (const phase of ["enter", "exit"] as const)
      for (let i = 0; i < variants.css[phase].length; i++)
        for (let value = 1; value < 5; value++)
          expect(
            Math.abs(variants.css[phase][i][value] - variants.tailwind[phase][i][value]),
          ).toBeLessThanOrEqual(value < 3 ? 0.005 : 0.5);
    expect(variants.css.exit[3][1]).toBeGreaterThan(0);
    expect(variants.tailwind.exit[3][2]).toBeGreaterThan(0);
    results[width] = variants;
  }
  await writeFile(".verify/fix3/dialog/frames-waapi.json", JSON.stringify(results, null, 2));
});
