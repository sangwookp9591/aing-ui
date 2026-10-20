import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

for (const styling of ["css", "tailwind"])
  test(`G2 G3 · ${styling} state crops and exit geometry`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/m1");
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() => page.evaluate(() => window.__aingToolDefinitions?.has("m1_save")))
      .toBe(true);
    if (styling === "tailwind") {
      await page.getByRole("radio", { name: "Tailwind v4" }).check();
      await expect(page.getByRole("button", { name: "Small", exact: true })).not.toHaveClass(
        /aing-button/,
      );
    }
    await expect
      .poll(() => page.evaluate(() => window.__aingToolDefinitions?.has("m1_save")))
      .toBe(true);
    const sizes = await page
      .getByTestId("buttons")
      .locator("button")
      .evaluateAll((buttons) =>
        Object.fromEntries(
          buttons.map((button) => [
            button.textContent?.trim(),
            [(button as HTMLElement).offsetWidth, (button as HTMLElement).offsetHeight],
          ]),
        ),
      );
    expect(sizes.Small[1]).toBe(32);
    expect(sizes.Large[1]).toBe(40);
    expect(sizes["변경사항 저장"][1]).toBe(36);
    expect(sizes["+"]).toEqual([36, 36]);
    const small = page.getByRole("button", { name: "Small", exact: true });
    expect(
      await small.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return (
          document.elementFromPoint(box.x + box.width / 2, box.y - 4)?.closest("button") === el
        );
      }),
    ).toBe(true);
    for (const [name, width, dark] of [
      ["1440", 1440, false],
      ["375", 375, false],
      ["dark", 1440, true],
    ] as const) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), dark);
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const [component, id] of [
        ["button", "buttons"],
        ["select", "select"],
        ["dialog", "dialogs"],
      ]) {
        const path = `.verify/fix2/${component}/${info.project.name}`;
        await mkdir(path, { recursive: true });
        await page.getByTestId(id).screenshot({ path: `${path}/${styling}-${name}.png` });
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole("button", { name: "설정 열기", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "작업 공간 설정", exact: true });
      await dialog.screenshot({
        path: `.verify/fix2/dialog/${info.project.name}/${styling}-${name}-open.png`,
      });
      const metrics = await dialog.evaluate((el) => ({
        title: getComputedStyle(el.querySelector("h2")!).fontSize,
        backdrop: getComputedStyle(el, "::backdrop").backgroundColor,
        bottom: el.getBoundingClientRect().bottom,
        viewport: innerHeight,
      }));
      expect(metrics.title).toBe("20px");
      expect(metrics.backdrop).toContain("0, 0, 0");
      if (width === 375) expect(metrics.bottom).toBe(metrics.viewport);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    for (const [state, label] of [
      ["disabled", "사용 불가"],
      ["loading", "저장 중 · Saving"],
      ["invalid", "다시 시도"],
    ]) {
      await page
        .getByRole("button", { name: label, exact: true })
        .screenshot({ path: `.verify/fix2/button/${info.project.name}/${styling}-${state}.png` });
    }
    for (const state of ["Empty", "Disabled", "Loading", "Invalid"]) {
      await page.getByRole("combobox", { name: state, exact: true }).screenshot({
        path: `.verify/fix2/select/${info.project.name}/${styling}-${state.toLowerCase()}.png`,
      });
    }
    const button = page.getByRole("button", { name: "변경사항 저장 · Save changes", exact: true });
    await page.keyboard.press("Tab");
    await button.focus();
    await button.screenshot({
      path: `.verify/fix2/button/${info.project.name}/${styling}-focus.png`,
    });
    expect(
      await button.evaluate((el) => ({
        outline: getComputedStyle(el).outlineWidth,
        offset: getComputedStyle(el).outlineOffset,
        shadow: getComputedStyle(el).boxShadow,
      })),
    ).toEqual({ outline: "3px", offset: "0px", shadow: "none" });
    await button.hover();
    await button.screenshot({
      path: `.verify/fix2/button/${info.project.name}/${styling}-hover.png`,
    });
    await page.mouse.down();
    await button.screenshot({
      path: `.verify/fix2/button/${info.project.name}/${styling}-active.png`,
    });
    await page.mouse.up();
    const select = page.getByRole("combobox", { name: "기본 지역", exact: true });
    await select.focus();
    await select.screenshot({
      path: `.verify/fix2/select/${info.project.name}/${styling}-focus.png`,
    });
    if (info.project.name === "chromium") {
      expect(await select.evaluate((el) => getComputedStyle(el).appearance)).toBe("base-select");
      await select.press("Space");
      await page.keyboard.press("ArrowDown");
      await expect
        .poll(() => select.evaluate((el) => getComputedStyle(el, "::picker(select)").opacity))
        .toBe("1");
      await page.screenshot({
        path: `.verify/fix2/select/${info.project.name}/${styling}-picker-open.png`,
      });
      await page.keyboard.press("Escape");
      await expect
        .poll(() => select.evaluate((el) => getComputedStyle(el, "::picker(select)").opacity))
        .toBe("0");
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "설정 열기", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "작업 공간 설정", exact: true });
    await panel.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    const closing = await panel.evaluate((el) => {
      const before = {
        width: (el as HTMLElement).offsetWidth,
        height: (el as HTMLElement).offsetHeight,
        gap: getComputedStyle(el).gap,
      };
      (el as HTMLDialogElement).close();
      return {
        before,
        after: {
          width: (el as HTMLElement).offsetWidth,
          height: (el as HTMLElement).offsetHeight,
          gap: getComputedStyle(el).gap,
        },
      };
    });
    // Engines without discrete exit support may close immediately.
    if (closing.after.height) expect(closing.after).toEqual(closing.before);
    await writeFile(
      `.verify/fix2/dialog/${info.project.name}/${styling}-${info.project.name}-exit.json`,
      JSON.stringify(closing, null, 2),
    );
    expect(errors).toEqual([]);
  });

test("G2 G3 · docs style toggles, visible labels, loading focus, hidden tools and pinned dialog regions", async ({
  page,
}, info) => {
  await mkdir(`.verify/fix2/dialog/${info.project.name}`, { recursive: true });
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const name of ["button", "dialog", "select"]) {
    await page.goto(`/docs/${name}`);
    await expect
      .poll(() => page.evaluate(() => window.__aingToolDefinitions?.size ?? 0))
      .toBeGreaterThan(0);
    await page.getByRole("radio", { name: "Tailwind v4" }).check();
    await expect(page.locator("[data-demo]")).toHaveAttribute("data-styling", "tailwind");
    if (name === "button") {
      const save = page.getByRole("button", { name: "변경사항 저장 · Save changes", exact: true });
      await expect(save).not.toHaveClass(/aing-button/);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              [...window.__aingToolDefinitions!.values()].filter((tool) =>
                tool.description.includes("Save changes"),
              ).length,
          ),
        )
        .toBe(1);
      await save.focus();
      await save.evaluate((element) => {
        const observer = new MutationObserver(() => {
          if (element.getAttribute("aria-busy") !== "true") return;
          observer.disconnect();
          // Read after core observers, before the demo's 700ms timer can restore the tool.
          queueMicrotask(() =>
            element.setAttribute(
              "data-loading-observation",
              JSON.stringify({
                busy: element.getAttribute("aria-busy"),
                focused: document.activeElement === element,
                disabled: (element as HTMLButtonElement).disabled,
                label: element.textContent,
                toolCount: [...window.__aingToolDefinitions!.values()].filter((tool) =>
                  tool.description.includes("Save changes"),
                ).length,
              }),
            ),
          );
        });
        observer.observe(element, { attributes: true, attributeFilter: ["aria-busy"] });
      });
      await save.press("Enter");
      await expect(save).toHaveAttribute("data-loading-observation", /.+/);
      const during = JSON.parse((await save.getAttribute("data-loading-observation"))!);
      expect(during.busy).toBe("true");
      expect(during.focused).toBe(true);
      expect(during.disabled).toBe(false);
      expect(during.label).toContain("변경사항 저장");
      expect(during.toolCount).toBe(0);
      await expect(save).not.toHaveAttribute("aria-busy");
    }
    if (name === "select") {
      const select = page.getByRole("combobox", { name: "기본 지역", exact: true });
      await expect(select).not.toHaveAttribute("aria-label");
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...window.__aingToolDefinitions!.values()].some((t) =>
              t.description.includes("기본 지역"),
            ),
          ),
        )
        .toBe(true);
      expect(await select.locator("option[aria-hidden]").count()).toBe(0);
      const enhanced = await page.evaluate(() => CSS.supports("appearance", "base-select"));
      await expect.poll(() => select.locator("option span").count()).toBe(enhanced ? 4 : 0);
      await page.getByRole("tab", { name: "Code", exact: true }).click();
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...window.__aingToolDefinitions!.values()].some((t) =>
              t.description.includes("기본 지역"),
            ),
          ),
        )
        .toBe(false);
    }
    if (name === "dialog") {
      await page.getByRole("button", { name: /설정 열기/ }).click();
      const dialog = page.getByRole("dialog", { name: "작업 공간 설정" });
      await dialog.evaluate((el) =>
        Promise.all(el.getAnimations().map((animation) => animation.finished)),
      );
      const scroll = await dialog.evaluate((el) => {
        const body = el.querySelector<HTMLElement>("[data-dialog-body]")!;
        for (let i = 0; i < 25; i++) {
          const p = document.createElement("p");
          p.textContent = `알림 설정 ${i}`;
          p.style.padding = "16px";
          body.append(p);
        }
        const header = el.querySelector("h2")!.getBoundingClientRect().top;
        const footer = el.querySelector("button:last-child")!.getBoundingClientRect().top;
        body.scrollTop = body.scrollHeight;
        return {
          header,
          afterHeader: el.querySelector("h2")!.getBoundingClientRect().top,
          footer,
          afterFooter: el.querySelector("button:last-child")!.getBoundingClientRect().top,
          scrollable: body.scrollHeight > body.clientHeight,
          scrollTop: body.scrollTop,
        };
      });
      expect(scroll.scrollable).toBe(true);
      expect(scroll.scrollTop).toBeGreaterThan(0);
      expect(scroll.header).toBe(scroll.afterHeader);
      expect(scroll.footer).toBe(scroll.afterFooter);
      await dialog.screenshot({
        path: `.verify/fix2/dialog/${info.project.name}/tailwind-${info.project.name}-long.png`,
      });
      await page.keyboard.press("Escape");
    }
  }
  expect(errors).toEqual([]);
});
