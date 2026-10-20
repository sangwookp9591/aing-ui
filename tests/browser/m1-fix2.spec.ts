import { test, expect } from "@playwright/test";

for (const styling of ["css", "tailwind"])
  test(`G2 G8 · ${styling} modal boundary blocks retained tools and removes duplicates`, async ({
    page,
  }) => {
    await page.goto("/m1");
    if (styling === "tailwind") await page.getByRole("radio", { name: "Tailwind v4" }).check();
    await expect
      .poll(() => page.evaluate(() => window.__aingTools?.has("m1_dialog_open")))
      .toBe(true);
    const result = await page.evaluate(async () => {
      const tools = window.__aingTools!;
      const retained = tools.get("m1_dialog_open")!;
      [...document.querySelectorAll("button")]
        .find((button) => button.textContent === "작업 공간 삭제")!
        .click();
      let error = "";
      try {
        await retained.execute({}, { signal: new AbortController().signal });
      } catch (cause) {
        error = String(cause);
      }
      await new Promise((done) => setTimeout(done, 0));
      const outside = [...tools.keys()].filter((name) =>
        ["m1_dialog_open", "m1_region", "m1_save"].includes(name),
      );
      const names = [...tools.keys()];
      const modalCount = document.querySelectorAll("dialog:modal").length;
      document.querySelector<HTMLDialogElement>("dialog:modal")!.close();
      return { error, outside, names, modalCount };
    });
    expect(result.error).toContain("modal");
    expect(result.outside).toEqual([]);
    expect(result.modalCount).toBe(1);
    expect(result.names.some((name) => /click_.*(close|dialog|open)/.test(name))).toBe(false);
    await expect
      .poll(() => page.evaluate(() => window.__aingTools?.has("m1_dialog_open")))
      .toBe(true);
    await page.evaluate(async () => {
      await window
        .__aingTools!.get("m1_dialog_open")!
        .execute({}, { signal: new AbortController().signal });
    });
    await expect(page.getByRole("dialog", { name: "작업 공간 설정", exact: true })).toBeVisible();
    const names = await page.evaluate(() => [...window.__aingTools!.keys()]);
    expect(names).toEqual(["m1_dialog_close"]);
    const nested = await page.evaluate(async () => {
      const retained = window.__aingTools!.get("m1_dialog_close")!;
      const parent = document.querySelector<HTMLDialogElement>("dialog:modal")!;
      const child = document.createElement("dialog");
      child.textContent = "Nested confirmation";
      parent.append(child);
      child.showModal();
      const attempt = async () => {
        try {
          await retained.execute({}, { signal: new AbortController().signal });
          return "allowed";
        } catch (error) { return String(error); }
      };
      const immediate = attempt();
      let refusal = Promise.resolve("");
      child.addEventListener("beforetoggle", event => {
        if ((event as ToggleEvent).newState === "closed") refusal = attempt();
      });
      child.close();
      const closing = await refusal;
      const open = parent.open;
      child.remove();
      return { immediate: await immediate, closing, open };
    });
    expect(nested.immediate).toContain("modal");
    expect(nested.closing).toContain("modal");
    expect(nested.open).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => page.evaluate(() => window.__aingTools?.has("m1_save"))).toBe(true);
  });

for (const styling of ["css", "tailwind"])
  test(`G2 · ${styling} full width sheet includes 640px boundary`, async ({ page }) => {
    await page.goto("/docs/dialog");
    if (styling === "tailwind") await page.getByRole("radio", { name: "Tailwind v4" }).check();
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [375, 640, 641]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole("button", { name: /설정 열기/ }).click();
      const panel = page.getByRole("dialog", { name: "작업 공간 설정" });
      const box = await panel.boundingBox();
      expect(Math.round(box!.width)).toBe(width <= 640 ? width : 448);
      if (width <= 640) expect(Math.round(box!.x)).toBe(0);
      const heights = await panel
        .locator("[data-slot=dialog-footer] button")
        .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
      expect(heights.every((height) => height >= 44)).toBe(true);
      await page.keyboard.press("Escape");
    }
  });
