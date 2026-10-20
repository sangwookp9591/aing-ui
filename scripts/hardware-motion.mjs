import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: false });
try {
  const cdp = await browser.newBrowserCDPSession();
  const { gpu } = await cdp.send("SystemInfo.getInfo");
  const renderer = gpu.devices.map((device) => device.deviceString).join("; ");
  const hardware = !!renderer && !/SwiftShader|llvmpipe|software/i.test(renderer);
  const page = await browser.newPage();
  await page.goto((process.env.VERIFY_ORIGIN ?? "http://localhost:3210") + "/m1");
  await expect
    .poll(() => page.evaluate(() => window.__aingTools?.has("m1_dialog_open")))
    .toBe(true);
  await page.bringToFront();
  const metrics = await page.evaluate(async () => {
    const sample = async (trigger = false) => {
      const frames = [];
      const pending = new Promise((done) => {
        let previous = 0;
        const frame = (time) => {
          if (previous) frames.push(time - previous);
          previous = time;
          if (frames.length < 30) requestAnimationFrame(frame);
          else done();
        };
        requestAnimationFrame(frame);
      });
      if (trigger) document.querySelector('button[command="show-modal"]').click();
      await pending;
      frames.sort((a, b) => a - b);
      return { p90: frames[Math.ceil(frames.length * 0.9) - 1], frames };
    };
    const baseline = await sample();
    const dialog = await sample(true);
    return {
      visibility: document.visibilityState,
      focused: document.hasFocus(),
      open: !!document.querySelector("dialog:modal"),
      baselineP90: baseline.p90,
      p90: dialog.p90,
      baselineFrames: baseline.frames,
      frames: dialog.frames,
    };
  });
  const evidence = {
    renderer,
    hardware,
    devices: gpu.devices,
    features: gpu.featureStatus,
    ...metrics,
  };
  await writeFile(".verify/m1-hardware-motion.json", JSON.stringify(evidence, null, 2));
  console.log(evidence);
  assert.ok(hardware, "G5 requires a hardware GPU");
  assert.equal(metrics.visibility, "visible");
  assert.ok(metrics.focused && metrics.open, "Measure the foreground modal interaction");
  assert.equal(metrics.frames.length, 30);
  assert.ok(metrics.p90 <= 20, `G5: ${metrics.p90}ms > 20ms`);
} finally {
  await browser.close();
}
