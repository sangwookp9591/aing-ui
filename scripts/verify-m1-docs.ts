import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const context = await browser.newContext({ permissions:['clipboard-read','clipboard-write'] });
const page = await context.newPage(), errors: string[] = [], checks: unknown[] = [];
page.on('pageerror', error=>errors.push(error.message)); page.on('console', message=>{if(message.type()==='error')errors.push(message.text());});
try {
  for(const name of ['button','dialog','select','card']) {
    await page.goto(`${process.env.VERIFY_ORIGIN ?? 'http://localhost:3210'}/docs/${name}`);
    await expect.poll(()=>page.evaluate(()=>window.__aingToolDefinitions?.size ?? 0)).toBeGreaterThan(0);
    const panel=page.getByLabel('Agent 패널',{exact:true}); await panel.locator('summary').click();
    await expect(panel.getByRole('button',{name:/실행$/}).first()).toBeVisible();
    await page.getByLabel('Copy page 메뉴',{exact:true}).click();
    for(const label of ['Copy page Markdown','Copy agent prompt','Copy MCP config','Copy WebMCP tools']) {
      await page.getByRole('button',{name:label,exact:true}).click(); const copied=await page.evaluate(()=>navigator.clipboard.readText());
      assert.ok(copied.length>0);
      if(label==='Copy WebMCP tools') {const tools=JSON.parse(copied);assert.ok(tools.length>0);assert.ok(tools.every((tool:{execute?:unknown})=>tool.execute===undefined));}
      checks.push({name,copy:label});
    }
    await page.getByLabel('Copy page 메뉴',{exact:true}).press('Escape');
    const safeName=await page.evaluate(()=>Array.from(window.__aingTools!.values()).find(tool=>!tool.annotations?.consequentialHint)!.name);
    await panel.getByRole('button',{name:`${safeName} 실행`,exact:true}).click();
    if(name==='dialog') await page.keyboard.press('Escape');
    await expect(panel.getByLabel('도구 호출 기록',{exact:true})).toContainText('완료');
  }
  assert.deepEqual(errors,[]);await writeFile('.verify/m1-docs.json',JSON.stringify({passed:true,checks,errors},null,2));console.log('PASS: copies, agent panel, logs and native-compatible tool definitions on 4 docs pages');
} finally {await browser.close();}
