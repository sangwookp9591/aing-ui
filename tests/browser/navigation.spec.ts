import { expect, test } from "@playwright/test";

for (const scenario of [
  { name: "desktop", width: 1440, reducedMotion: "no-preference" },
  { name: "mobile", width: 375, reducedMotion: "no-preference" },
  { name: "reduced motion", width: 1440, reducedMotion: "reduce" },
] as const) {
test(`menu navigation preserves the page shell (${scenario.name})`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: scenario.width, height: 1000 });
  await page.emulateMedia({ reducedMotion: scenario.reducedMotion });
  await page.goto("/docs/ai-chat");
  const shell = await page.locator("#main").evaluateHandle((main) => main.parentElement!);
  await expect.poll(() => shell.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  const header = await page.locator("header").elementHandle();

  for (const [name, title] of [["card", "Card"], ["reaction-bar", "Reaction Bar"], ["tool-call", "Tool Call"], ["progress-tracker", "Progress Tracker"]]) {
    await page.getByRole("navigation", { name: "컴포넌트 목록", exact: true }).locator(`a[href="/docs/${name}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/docs/${name}$`));
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    expect(await header!.evaluate((element) => element.isConnected)).toBe(true);
    expect(await shell.evaluate((element) => element.isConnected), "navigation must keep the entrance wrapper mounted").toBe(true);
    expect(await shell.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    expect(await shell.evaluate((element) => getComputedStyle(element).filter)).toMatch(/^(none|blur\(0px\))$/);
  }
  await page.getByRole("navigation", { name: "주 메뉴", exact: true }).locator('a[href="/"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("사람의 인터페이스");
  expect(await shell.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole("navigation", { name: "주 메뉴", exact: true }).getByRole("link", { name: "컴포넌트", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/ai-chat$/);
  expect(await shell.evaluate((element) => element.isConnected)).toBe(true);
  await expect(page.getByRole("heading", { level: 1, name: "AI Chat", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
}
