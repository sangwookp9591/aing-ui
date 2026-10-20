import { chromium, expect, type Locator } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const origin = process.env.VERIFY_ORIGIN ?? "http://localhost:3210";
await mkdir(".verify/shots-v3", { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome" });
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
const routes = ["", "ai-chat", "reaction-bar", "card", "tool-call", "progress-tracker"];
const checks: unknown[] = [];
async function ready(name: string) {
  if (name) await expect.poll(() => page.evaluate(() => window.__aingTools?.size ?? 0)).toBeGreaterThan(0);
  else {
    await expect.poll(() => page.locator('textarea').evaluate((el: HTMLTextAreaElement) => el.style.height)).not.toBe("");
    for (const article of await page.locator("#components article").all()) {
      await article.scrollIntoViewIfNeeded();
      await expect.poll(() => article.evaluate(el => getComputedStyle(el.parentElement!).opacity)).toBe("1");
    }
    await page.locator("h1").scrollIntoViewIfNeeded();
  }
  await expect.poll(() => page.locator("main").evaluate(el => getComputedStyle(el.parentElement!).opacity)).toBe("1");
}
async function hold(button: Locator, ms = 1000) {
  await button.scrollIntoViewIfNeeded();
  await button.hover();
  const box = await button.boundingBox(); assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // The hold threshold itself is under test.
  await page.waitForTimeout(ms);
  await page.mouse.up();
}
async function openAgent(name: string) {
  await page.goto(`${origin}/docs/${name}`);
  await page.getByLabel("Agent 패널", { exact: true }).locator("summary").first().click();
}
async function execute(name: string, consequential = false) {
  const panel = page.getByLabel("Agent 패널", { exact: true });
  await panel.getByRole("button", { name: `${name} 실행`, exact: true }).click();
  if (consequential) {
    const approve = panel.getByRole("button", { name: "Allow 길게 눌러 승인" });
    if (name === "card_demo_action") await hold(approve);
    else {
      await approve.press("Enter");
      await expect(approve).toHaveText("확인 · Allow");
      await approve.press("Enter");
    }
  }
  const trace = page.getByLabel("도구 호출 기록").locator("details").first();
  await expect(trace.locator("summary")).toContainText(name);
  await expect(trace.getByRole("status")).toHaveText("완료");
  await trace.locator("summary").click();
}
try {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of routes) {
      const route = name ? `/docs/${name}` : "/";
      assert.equal((await page.goto(origin + route))?.status(), 200);
      await ready(name);
      await expect(page.locator("h1")).toBeVisible();
      if (name) await expect(page.locator("[data-demo]")).toBeVisible();
      else await expect(page.locator("[data-mini]")).toHaveCount(5);
      const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert.equal(size.scroll, size.client, `${route} ${width} overflow`);
      await page.screenshot({ path: `.verify/shots-v3/${name || "home"}-${width}.png`, fullPage: true });
      checks.push({ route, width, ...size });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openAgent("ai-chat");
  await execute("chat_demo_send_message", true);
  await expect(page.getByRole("log")).toContainText("에이전트가 보낸 메시지입니다.");
  await expect(page.getByRole("log")).toContainText("로컬 스트리밍 데모입니다.");
  await execute("chat_demo_read_messages");
  await expect(page.getByLabel("도구 호출 기록")).toContainText("로컬 스트리밍 데모입니다.");
  const input = page.getByRole("textbox", { name: "메시지", exact: true });
  await input.fill("키보드"); await input.press("Shift+Enter"); await expect(input).toHaveValue("키보드\n"); await input.press("Enter");
  await expect(input).toHaveValue(""); await expect(page.getByRole("log")).toContainText("키보드");
  await page.getByRole("button", { name: "답변 중지", exact: true }).click();
  await expect(page.getByRole("button", { name: "답변 중지", exact: true })).toHaveCount(0);
  const stopped = await page.getByRole("log").innerText();
  await page.waitForTimeout(200); assert.equal(await page.getByRole("log").innerText(), stopped, "stop must cancel the streaming timer");
  await input.fill("긴 메시지 확인\n".repeat(150)); await input.press("Enter");
  const log = page.getByRole("log");
  await expect.poll(() => log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)).toBeLessThan(48);
  await log.hover(); await page.mouse.wheel(0, -10000);
  await expect.poll(() => log.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(page.getByRole("button", { name: "답변 중지", exact: true })).toHaveCount(0);
  assert.equal(await log.evaluate((el) => el.scrollTop), 0);
  await openAgent("reaction-bar");
  await execute("reaction_demo_toggle", true);
  await expect(page.getByRole("button", { name: "👍 반응 13개", exact: true })).toHaveAttribute("aria-pressed", "true");
  await execute("reaction_demo_list");
  await page.getByRole("button", { name: "👍 반응 13개", exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "👍 반응 12개", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel("반응 추가", { exact: true }).click();
  await page.getByRole("button", { name: "🔥 추가", exact: true }).click();
  await expect(page.getByRole("button", { name: "🔥 반응 1개", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "reaction_demo_toggle 실행", exact: true }).click();
  const reject = page.getByLabel("Agent 패널", { exact: true }).getByRole("button", { name: "Deny", exact: true });
  await reject.click();
  await expect(page.getByRole("button", { name: "👍 반응 12개", exact: true })).toHaveAttribute("aria-pressed", "false");
  await openAgent("card");
  await execute("card_demo_action", true); await expect(page.locator("[data-demo]")).toContainText("아이디어를 저장했어요.");
  await execute("card_readonly_read"); await expect(page.getByLabel("도구 호출 기록")).toContainText("읽기 전용 카드");
  const card = page.locator("[data-demo] section").first();
  await card.hover(); await expect(card).toHaveCSS("border-color", "rgb(113, 113, 122)");
  await page.locator("h1").hover(); await expect(card).toHaveCSS("border-color", "rgb(228, 228, 231)");
  await openAgent("tool-call");
  await execute("toolcall_demo"); await expect(page.getByLabel("도구 호출 기록")).toContainText("write_component");
  const demo = page.locator("[data-demo]");
  const approval = demo.getByRole("button", { name: "Allow 길게 눌러 승인", exact: true });
  await approval.click(); await expect(demo.getByRole("status").first()).toHaveText("승인 대기");
  await hold(approval, 250); await expect(demo.getByRole("status").first()).toHaveText("승인 대기");
  await approval.hover(); await page.mouse.down(); await page.mouse.move(0, 0); await page.waitForTimeout(950); await page.mouse.up();
  await expect(demo.getByRole("status").first()).toHaveText("승인 대기");
  await hold(approval); await expect(demo.getByRole("status").first()).toHaveText("실행 중");
  await expect(demo.getByRole("status").first()).toHaveText("완료");
  const details = demo.locator("details").first();
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").press("Enter"); await expect(details).toHaveAttribute("open", ""); await expect(details).toContainText("updated");
  await demo.getByRole("button", { name: "승인 데모 초기화" }).click();
  await demo.getByRole("button", { name: "Deny", exact: true }).click(); await expect(demo.getByRole("status").first()).toHaveText("실패");
  await demo.getByRole("button", { name: "승인 데모 초기화" }).click();
  await approval.press("Enter"); await expect(approval).toHaveText("확인 · Allow");
  await approval.press("Tab"); await approval.focus(); await expect(approval).toHaveText("Allow");
  await approval.press("Enter"); await approval.press("Enter"); await expect(demo.getByRole("status").first()).toHaveText("완료");
  await openAgent("progress-tracker");
  await page.getByRole("button", { name: "horizontal 배치", exact: true }).click();
  await page.setViewportSize({ width: 375, height: 1000 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375);
  await page.screenshot({ path: ".verify/shots-v3/progress-horizontal-375.png", fullPage: true });
  await page.getByRole("button", { name: "vertical 배치", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await execute("progress_demo_advance", true); await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "67");
  await execute("progress_demo_get_status"); await expect(page.getByLabel("도구 호출 기록")).toContainText("67");
  await page.getByRole("button", { name: "다음 단계", exact: true }).press("Enter"); await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByRole("button", { name: "다음 단계", exact: true })).toBeDisabled();
  const codeTab = page.getByRole("tab", { name: "Code", exact: true });
  await codeTab.click(); await expect(page.getByRole("tabpanel").first()).toContainText("<ProgressTracker");
  await codeTab.press("ArrowLeft"); await expect(page.getByRole("tab", { name: "Preview", exact: true })).toBeFocused();
  const install = page.getByRole("tab", { name: "Agent", exact: true });
  await install.press("ArrowRight"); await expect(page.getByRole("tab", { name: "pnpm", exact: true })).toBeFocused();
  await expect(page.locator("#installation")).toContainText("pnpm dlx");
  await page.getByRole("tab", { name: "npm", exact: true }).click(); await expect(page.locator("#installation")).toContainText("npx shadcn@4.22.1");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  for (const label of ["Agent", "pnpm", "npm", "MCP"]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    const text = await page.locator("#installation code").innerText();
    await page.getByRole("button", { name: "설치 명령 복사", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const name of ["", "tool-call"]) {
    await page.goto(origin + (name ? `/docs/${name}` : "/"));
    await ready(name);
    await page.getByRole("button", { name: "라이트 / 다크 테마 전환", exact: true }).click();
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(16, 16, 18)");
    await page.screenshot({ path: `.verify/shots-v3/${name || "home"}-dark-1440.png`, fullPage: true });
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
  }
  await page.goto(origin + "/"); await expect.poll(() => page.evaluate(() => window.__aingTools?.size ?? 0)).toBeGreaterThanOrEqual(8);
  await page.locator('[data-mini="reaction-bar"]').getByRole("button", { name: "👍 반응 12개", exact: true }).click();
  await expect(page.locator('[data-mini="reaction-bar"]').getByRole("button", { name: "👍 반응 13개", exact: true })).toHaveAttribute("aria-pressed", "true");
  await mkdir(".verify/compare-v3", { recursive: true });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1920, height: 939 });
  for (const name of ["tool-call", "ai-chat"]) {
    await page.goto(`${origin}/docs/${name}`);
    await ready(name);
    await expect(page.locator("[data-demo]")).toBeVisible();
    await page.screenshot({ path: `.verify/compare-v3/aing-${name}-1920.png` });
    await page.locator(name === "tool-call" ? "[data-demo] details" : "[data-demo] section").first().screenshot({ path: `.verify/compare-v3/aing-${name}-component.png` });
  }
  assert.deepEqual(errors, []);
  await writeFile(".verify/browser-v3.json", JSON.stringify({ checks, toolsExecuted: 9, approval: ["pointer hold", "early release", "pointer leave", "keyboard confirmation", "blur reset", "deny", "auto-collapse"], keyboard: true, stop: true, scrollFollow: true, reactionAdd: true, spotlight: true, tabs: true, dark: true, reducedMotion: true, consoleErrors: errors, passed: true }, null, 2));
  console.log(`PASS: ${checks.length} responsive pages, 9 tool paths, hold/keyboard approval, stop, reactions, spotlight, tabs, dark, reduced motion, console errors 0`);
} finally { await browser.close(); }
