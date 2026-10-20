import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
test.beforeEach(async ({ page }) => { await page.goto('/m1'); await page.evaluate(() => document.fonts.ready); await expect.poll(()=>page.evaluate(()=>window.__aingToolDefinitions?.has('m1_save'))).toBe(true); });
test('G2 G3 · button, native select, modal APG keyboard, focus restoration, form and tool contracts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.getByRole('button', { name: '변경사항 저장 · Save changes', exact: true }).click(); await expect(page.getByTestId('save-status')).toHaveText('1회 저장');
  const select = page.getByRole('combobox', { name: '기본 지역', exact: true }); await select.focus();
  for (const [key,value] of [['End','tokyo'],['Home','seoul'],['ArrowDown','tokyo'],['ArrowUp','seoul']]) {
    await select.press('Space'); await page.keyboard.press(key); await page.keyboard.press('Enter'); await expect(select).toHaveValue(value);
  }
  await select.press('Space'); await page.keyboard.press('Escape'); await expect(select).toHaveValue('seoul');
  await page.keyboard.press('t'); await page.keyboard.press('Enter');
  await expect(select).toHaveValue('tokyo');
  await page.getByRole('button', { name: '지역 적용', exact: true }).click(); await expect(page.getByTestId('form-output')).toHaveText('tokyo');
  await page.getByRole('button', { name: '설정 열기', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '작업 공간 설정', exact: true }); await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox')).toBeFocused();
  const last = dialog.locator('input,select,button').last();
  await last.focus();
  // Native modal cycles may include browser chrome and the dialog itself on macOS.
  for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 10; i++) {
    await page.keyboard.press(key);
    expect(await dialog.evaluate(el => document.activeElement === document.body || el.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole('combobox').selectOption('tokyo'); await expect(dialog.getByRole('combobox')).toHaveValue('tokyo');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button', { name: '설정 열기', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '설정 열기', exact: true }).click(); await page.mouse.click(0,0); await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: '작업 공간 삭제', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible(); await expect(page.getByRole('button', { name: '유지하기' })).toBeFocused(); await page.mouse.click(0,0); await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('alertdialog')).not.toBeVisible();
  const result = await page.evaluate(async () => {
    const tools = window.__aingTools!; const context = { signal: new AbortController().signal };
    await tools.get('m1_save')!.execute({}, context); await tools.get('m1_region')!.execute({ value: 'seoul' }, context);
    let rejected = false; try { await tools.get('m1_region')!.execute({ value: 'sydney' }, context); } catch { rejected = true; }
    await tools.get('m1_dialog_open')!.execute({}, context);
    return { rejected, names: [...tools.keys()] };
  });
  expect(result.rejected).toBe(true); expect(new Set(result.names).size).toBe(result.names.length); expect(result.names.every(n => /^[\w.-]{1,128}$/.test(n))).toBe(true);
  await expect(dialog).toBeVisible();
  await page.evaluate(() => window.__aingTools!.get('m1_dialog_close')!.execute({}, { signal: new AbortController().signal }));
  await expect(dialog).not.toBeVisible(); await expect(select).toHaveValue('seoul'); await expect(page.getByTestId('save-status')).toHaveText('2회 저장');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Tab');
  const button = page.getByRole('button', {name: '변경사항 저장 · Save changes', exact:true}); await button.focus();
  expect(await button.evaluate(el => ({outline:getComputedStyle(el).outlineWidth,shadow:getComputedStyle(el).boxShadow}))).toEqual({outline:'3px',shadow:'none'});
  const hitArea = await button.evaluate(el => {
    const style = getComputedStyle(el, '::before');
    return { height: parseFloat(style.minHeight), width: parseFloat(style.minWidth) };
  });
  expect(hitArea.height).toBeGreaterThanOrEqual(44); expect(hitArea.width).toBeGreaterThanOrEqual(44);
  expect((await select.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(errors).toEqual([]);
});
test('G5 · reduced motion is instant, layout stays fixed and software frames are recorded', async ({ page }, info) => {
  await page.goto('about:blank');
  const baselineP90 = await page.evaluate(async () => {
    const frames: number[] = [];
    await new Promise<void>(done => {
      let previous = 0;
      function frame(time: number) {
        if (previous) frames.push(time - previous);
        previous = time;
        if (frames.length < 30) requestAnimationFrame(frame); else done();
      }
      requestAnimationFrame(frame);
    });
    return frames.sort((a,b) => a-b)[Math.ceil(frames.length * .9)-1];
  });
  await page.goto('/m1'); await page.evaluate(() => document.fonts.ready);
  await expect.poll(()=>page.evaluate(()=>window.__aingToolDefinitions?.has('m1_save'))).toBe(true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.getByRole('button', { name: '변경사항 저장 · Save changes', exact: true }).evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.getByRole('button', { name: '설정 열기', exact: true }).click();
  expect(await page.getByRole('dialog', { name: '작업 공간 설정', exact: true }).evaluate(el => el.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  const metrics = await page.evaluate(async () => {
    const frames: number[] = [], shifts: number[] = []; let geometryChanges = 0;
    const observer = typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes.includes('layout-shift') ? new PerformanceObserver(list => shifts.push(...list.getEntries().map(e => (e as PerformanceEntry & {value: number}).value))) : null;
    observer?.observe({ type: 'layout-shift' });
    const dialog = document.querySelector('dialog')!; dialog.showModal();
    const layout = () => Array.from(document.querySelectorAll<HTMLElement>('[data-testid=buttons],[data-testid=select],[data-testid=dialogs],dialog')).map(el=>[el.offsetLeft,el.offsetTop,el.offsetWidth,el.offsetHeight]);
    const initialLayout = JSON.stringify(layout());
    await new Promise<void>(done => { let previous = 0; const frame = (time: number) => { if (previous) frames.push(time - previous); if(JSON.stringify(layout()) !== initialLayout) geometryChanges++; previous = time; if (frames.length < 30) requestAnimationFrame(frame); else done(); }; requestAnimationFrame(frame); });
    dialog.close(); observer?.disconnect(); frames.sort((a,b) => a-b);
    return { p90: frames[Math.ceil(frames.length * .9)-1], layoutShiftSupported: !!observer, layoutShift: observer ? shifts.reduce((a,b) => a+b,0) : null, geometryChanges, samples: frames.length };
  });
  await mkdir('.verify/m1-motion', { recursive: true }); await writeFile(`.verify/m1-motion/${info.project.name}.json`, JSON.stringify({...metrics, baselineP90, deltaP90: metrics.p90 - baselineP90}, null, 2));
  expect(metrics.geometryChanges).toBe(0); if(metrics.layoutShiftSupported) expect(metrics.layoutShift).toBe(0); // Automated engines are reference measurements; hardware GPU frames are gated by Ego Lite.
  expect(metrics.samples).toBeGreaterThanOrEqual(30);
});
test('G4 · 1440, 375, dark, all states and actual motion frames', async ({ page }, info) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await mkdir(`.verify/m1-shots/${info.project.name}`, { recursive: true });
  await mkdir('.verify/m1-motion', { recursive: true });
  for (const [name, width, dark] of [['desktop',1440,false], ['mobile',375,false], ['dark',1440,true]] as const) {
    await page.setViewportSize({ width, height: 1000 });
    if(await page.evaluate(()=>document.documentElement.classList.contains('dark')) !== dark) await page.getByRole('button',{name:'라이트 / 다크 테마 전환',exact:true}).click();
    await page.mouse.move(0,0);await page.evaluate(()=>(document.activeElement as HTMLElement | null)?.blur());
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, maxDiffPixelRatio: .002 });
    await page.screenshot({ path: `.verify/m1-shots/${info.project.name}/${name}.png`, fullPage: true });
    await page.getByRole('button',{name:'설정 열기',exact:true}).click();
    const panel=page.getByRole('dialog',{name:'작업 공간 설정',exact:true}); await panel.screenshot({path:`.verify/m1-shots/${info.project.name}/dialog-${name}.png`});
    const bounds=(await panel.boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');await expect(panel).not.toBeVisible();await page.evaluate(()=>window.scrollTo(0,0));
  }
  if(await page.evaluate(()=>document.documentElement.classList.contains('dark'))) await page.getByRole('button',{name:'라이트 / 다크 테마 전환',exact:true}).click();
  const path = `.verify/m1-shots/${info.project.name}`;
  for(const [state,name] of [['disabled','사용 불가'],['loading','저장 중 · Saving'],['invalid','다시 시도']]) await page.getByRole('button',{name,exact:true}).screenshot({path:`${path}/${state}.png`});
  for(const name of ['Empty','Disabled','Invalid']) await page.getByRole('combobox',{name,exact:true}).screenshot({path:`${path}/select-${name.toLowerCase()}.png`});
  for (const state of ['buttons', 'select', 'dialogs']) await page.getByTestId(state).screenshot({ path: `${path}/${state}.png` });
  const button = page.getByRole('button', { name: '변경사항 저장 · Save changes', exact: true });
  await button.hover(); await button.screenshot({ path: `${path}/hover.png` }); await button.focus(); await button.screenshot({ path: `${path}/focus.png` });
  const box = (await button.boundingBox())!; await page.mouse.move(box.x+box.width/2, box.y+box.height/2); await page.mouse.down(); await button.screenshot({ path: `${path}/active.png` }); await page.mouse.up();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByTestId('dialogs').screenshot({ path: `${path}/motion-before.png` });
  await page.getByRole('button', { name: '설정 열기', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '작업 공간 설정', exact: true });
  const during = await dialog.evaluate(el => { const animations = el.getAnimations(); animations.forEach(animation => { animation.pause(); animation.currentTime = 110; }); return { animations: animations.length, opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }; });
  await dialog.screenshot({ path: `${path}/motion-during.png`, animations: 'allow' });
  const after = await dialog.evaluate(el => { el.getAnimations().forEach(animation => animation.finish()); return { opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }; });
  await dialog.screenshot({ path: `${path}/motion-after.png`, animations: 'allow' });
  await writeFile(`.verify/m1-motion/frames-${info.project.name}.json`, JSON.stringify({during,after},null,2));
});
test('G2 G3 · controlled Dialog can veto opening, Escape, backdrop, close and native form dismissal', async ({page}) => {
  await page.goto('/m1/controlled'); const trigger=page.getByRole('button',{name:'Open controlled',exact:true}), dialog=page.getByRole('dialog',{name:'Controlled settings'});
  await trigger.click(); await expect(dialog).not.toBeVisible(); await expect(page.getByTestId('controlled-state')).toContainText('closed');
  await page.getByRole('checkbox',{name:'Allow opening'}).check(); await trigger.click(); await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape'); await expect(dialog).toBeVisible(); await page.mouse.click(0,0); await expect(dialog).toBeVisible();
  await page.getByRole('button',{name:'Close controlled',exact:true}).click(); await expect(dialog).toBeVisible();
  await page.getByRole('button',{name:'Submit dialog form',exact:true}).click(); await expect(dialog).toBeVisible();
  await page.getByRole('checkbox',{name:'Allow closing'}).check(); await page.getByRole('button',{name:'Close controlled',exact:true}).click();
  await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
});
test('G3 · every Button variant keeps AA contrast and a single focus ring in light, dark and hover states', async ({page},info) => {
  await page.emulateMedia({reducedMotion:'reduce'}); const path=`.verify/m1-shots/${info.project.name}`;await mkdir(path,{recursive:true});
  for(const dark of [false,true]) {
    await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
    for(const variant of ['default','secondary','outline','ghost','destructive','link']) {
      const button=page.getByRole('button',{name:variant,exact:true});await button.hover();
      expect((await new AxeBuilder({page}).include('[data-testid="buttons"]').analyze()).violations).toEqual([]);
      await button.screenshot({path:`${path}/${variant}-hover-${dark?'dark':'light'}.png`});
      await page.keyboard.press('Tab');await button.focus();
      expect(await button.evaluate(el=>({outline:getComputedStyle(el).outlineWidth,shadow:getComputedStyle(el).boxShadow}))).toEqual({outline:'3px',shadow:'none'});
    }
  }
});
