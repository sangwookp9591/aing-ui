import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
const path = resolve('.verify/m1-ego-space.json');
let space: {id?: number} = {}; try { space = JSON.parse(await readFile(path, 'utf8')); } catch {}
const script = `
const task = await taskSpace(${space.id ?? JSON.stringify('aing M1 native verification')});
const page = task.page('p1');
await page.goto(${JSON.stringify(process.env.VERIFY_ORIGIN ?? 'http://localhost:3210')} + '/m1');
await page.waitForFunction(() => window.__aingToolDefinitions?.has('m1_save'));
const windowInfo = await task.cdp('Browser.getWindowForTarget', {targetId:page.targetId});
await task.cdp('Browser.setWindowBounds', {windowId:windowInfo.windowId,bounds:{windowState:'normal'}});
await page.cdp('Page.bringToFront');
const evidence = await page.evaluate(async () => {
 const native = document.modelContext;
 if (!native?.executeTool || !native?.getTools) return {available:false};
 const tools = await native.getTools();
 const before = document.querySelector('[data-testid="save-status"]').textContent;
 const tool = tools.find(tool => tool.name === 'm1_save');
 await native.executeTool(tool, '{}');
 return {available:true, before, names:tools.map(tool=>String(tool.name))};
});
if(evidence.available) {
 await page.waitForFunction(() => document.querySelector('[data-testid="save-status"]').textContent === '1회 저장');
 evidence.after = await page.evaluate(() => document.querySelector('[data-testid="save-status"]').textContent);
 await page.screenshot({path:${JSON.stringify(resolve('.verify/m1-ego-native.png'))}});
}
if(evidence.available) {
 evidence.modal = await page.evaluate(async () => {
  const native = document.modelContext;
  const retained = (await native.getTools()).find(tool => tool.name === 'm1_dialog_open');
  [...document.querySelectorAll('button')].find(button => button.textContent === '작업 공간 삭제').click();
  await new Promise(done => setTimeout(done, 0));
  const outside = (await native.getTools()).filter(tool => ['m1_save','m1_region','m1_dialog_open'].includes(tool.name)).map(tool=>tool.name);
  let refusal = '';
  try { await native.executeTool(retained, '{}'); } catch(error) { refusal=String(error); }
  const modalCount = document.querySelectorAll('dialog:modal').length;
  document.querySelector('dialog:modal').close();
  await new Promise(done => setTimeout(done, 0));
  const restored = (await native.getTools()).map(tool=>tool.name);
  return {outside,refusal,modalCount,restored};
 });
 await page.waitForFunction(() => window.__aingToolDefinitions?.has('m1_dialog_open'));
 evidence.modal.restored = await page.evaluate(async () => (await document.modelContext.getTools()).map(tool => tool.name));
}
const spaceId=task.spaceId;
const closed=${!space.id} && evidence.available;
if(closed) await task.finish({keep:[]});
console.log('AING_EVIDENCE:'+JSON.stringify({spaceId,closed,...evidence}));
`;
const child = spawn('ego-browser', ['nodejs'], { stdio: ['pipe', 'pipe', 'pipe'] });
let output = ''; child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; }); child.stdin.end(script);
const code = await new Promise<number|null>(done => child.on('close', done));
await writeFile('.verify/m1-ego.log', output); assert.equal(code, 0, output);
const evidence = JSON.parse(output.split('AING_EVIDENCE:')[1].split('\n')[0]);
if(evidence.closed) await unlink(path).catch(error=>{if(error.code!=='ENOENT')throw error;}); else await writeFile(path, JSON.stringify({id:evidence.spaceId})); await writeFile('.verify/m1-native.json', JSON.stringify(evidence,null,2));
assert.equal(evidence.available,true,'Native WebMCP unavailable in Ego Lite'); assert.equal(evidence.after,'1회 저장');
console.log(evidence);

assert.deepEqual(evidence.modal.outside,[]); assert.ok(evidence.modal.refusal); assert.equal(evidence.modal.modalCount,1); assert.ok(evidence.modal.restored.includes('m1_dialog_open'));
