import {chromium, expect, type Locator} from "@playwright/test";
import assert from "node:assert/strict";
import {mkdir, writeFile} from "node:fs/promises";
const origin=process.env.VERIFY_ORIGIN ?? "http://localhost:3210";
await mkdir(".verify/motion",{recursive:true});
await mkdir(".verify/shots-v3",{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL ?? "chrome"});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:["clipboard-read","clipboard-write"]});
const page=await context.newPage();
const errors:string[]=[]; const checks:unknown[]=[];
page.on("console",message=>{if(message.type()==="error")errors.push(`${page.url()}: ${message.text()}`);});
page.on("pageerror",error=>errors.push(`${page.url()}: ${error.message}`));
async function visit(name:string){await page.goto(`${origin}/docs/${name}`);await expect.poll(()=>page.evaluate(()=>window.__aingTools?.size ?? 0)).toBeGreaterThan(0);await expect(page.locator("[data-demo]")).toBeVisible();await page.waitForTimeout(280);}
async function frame(name:string,index:number){await page.screenshot({path:`.verify/motion/${name}-${index}.png`});checks.push({motion:name,frame:index,animations:await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==="running").length)});}
async function focused(name:string,locator:Locator){await locator.focus();assert.equal(await locator.evaluate(el=>getComputedStyle(el).outlineStyle),"none");await page.screenshot({path:`.verify/shots-v3/focus-${name}-1440.png`});}
try {
 await visit("ai-chat");
 const input=page.getByRole("textbox",{name:"메시지",exact:true});await input.click();
 const focus=await input.evaluate(el=>({outline:getComputedStyle(el).outlineStyle,shadow:getComputedStyle(el).boxShadow,container:getComputedStyle(el.parentElement!).boxShadow}));
 assert.equal(focus.outline,"none");assert.ok(focus.shadow === "none" || [...focus.shadow.matchAll(/(-?\d+(?:\.\d+)?)px/g)].every(match => Number(match[1]) === 0));assert.ok(focus.container.includes("3px"));await focused("ai-chat",input);checks.push({focus});
 await input.fill("모션 확인"); await frame("message",0);await page.getByRole("button",{name:"메시지 보내기",exact:true}).click();await frame("message",1);await expect(page.getByRole("log")).toContainText("로컬 스트리밍 데모입니다.");await frame("message",2);
 await visit("tool-call");const approve=page.locator("[data-demo]").getByRole("button",{name:"Allow 길게 눌러 승인",exact:true});await focused("tool-call",approve);
 await approve.hover();const box=await approve.boundingBox();assert.ok(box);await frame("hold",0);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(380);await frame("hold",1);await expect(page.locator("[data-demo]").getByRole("status").first()).toHaveText("완료");await page.mouse.up();await frame("hold",2);
 await visit("reaction-bar");const reaction=page.getByRole("button",{name:"👍 반응 12개",exact:true});await focused("reaction-bar",reaction);await frame("reaction",0);await reaction.click();await frame("reaction",1);await expect(page.getByRole("button",{name:"👍 반응 13개",exact:true})).toHaveAttribute("aria-pressed","true");await page.waitForTimeout(350);await frame("reaction",2);
 await visit("progress-tracker");const next=page.getByRole("button",{name:"다음 단계",exact:true});await focused("progress-tracker",next);await frame("progress",0);await next.click();await frame("progress",1);await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow","67");await page.waitForTimeout(300);await frame("progress",2);
 await frame("tabs",0);await page.getByRole("tab",{name:"Code",exact:true}).click();await frame("tabs",1);await page.waitForTimeout(300);await frame("tabs",2);
 await visit("card");await focused("card",page.locator("[data-demo]").getByRole("button",{name:"프로젝트에 저장",exact:true}));
 await page.locator("h1").scrollIntoViewIfNeeded();await frame("copy",0);await page.getByRole("button",{name:"Copy page",exact:true}).click();await frame("copy",1);await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain("# Card");await page.waitForTimeout(200);await frame("copy",2);
 for(const name of ["ai-chat","reaction-bar","card","tool-call","progress-tracker"]){
  await visit(name);await page.getByLabel("Copy page 메뉴",{exact:true}).click();
  const expectedTitle=await page.locator("h1").innerText();
  for(const label of ["Copy page Markdown","Copy agent prompt","Copy MCP config","Copy WebMCP tools"]){
   await page.getByRole("button",{name:label,exact:true}).click();const copied=await page.evaluate(()=>navigator.clipboard.readText());
   if(label==="Copy page Markdown"){assert.ok(copied.startsWith(`# ${expectedTitle}`));for(const section of ["## 설치","## 사용 예","## Props","## WebMCP 도구"])assert.ok(copied.includes(section));}
   if(label==="Copy agent prompt"){assert.ok(copied.includes(`/r/${name}.json`));assert.ok(copied.includes("WebMCP"));}
   if(label==="Copy MCP config"){const config=JSON.parse(copied);assert.deepEqual(config[".mcp.json"].mcpServers.shadcn.args,["shadcn@4.22.1","mcp"]);assert.equal(config["components.json"].registries["@aing"],`${origin}/r/{name}.json`);}
   if(label==="Copy WebMCP tools"){const defs=JSON.parse(copied);assert.ok(defs.length>0);for(const def of defs){assert.equal(def.inputSchema.type,"object");assert.equal(typeof def.name,"string");assert.equal(typeof def.description,"string");assert.ok(def.annotations);assert.equal(def.execute,undefined);}}
   checks.push({name,clipboard:label,passed:true});
  }
  for(const service of ["ChatGPT","Claude"]){const link=page.getByRole("link",{name:`Open in ${service}`,exact:true});const url=new URL((await link.getAttribute("href"))!);assert.ok(url.toString().length<1800);assert.ok(url.searchParams.get("q")?.includes(`${origin}/docs/${name}`));assert.equal(await link.getAttribute("target"),"_blank");checks.push({name,open:service,url:url.toString(),passed:true});}
  await page.getByLabel("Copy page 메뉴",{exact:true}).press("Escape");await page.getByRole("tab",{name:"Code",exact:true}).click();
  const previewCode=page.locator('[role="tabpanel"]').first();await previewCode.getByRole("button",{name:"코드 복사",exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await previewCode.locator("code").innerText());
  const usage=page.locator("#usage");await usage.getByRole("button",{name:"코드 복사",exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await usage.locator("code").innerText());
 }
 // Validate link activation locally without sending the prompt to a service.
 await visit("card");await context.route(/https:\/\/(chatgpt\.com|claude\.ai)\//,route=>route.fulfill({status:200,contentType:"text/html",body:"<!doctype html><title>Local test target</title>"}));await page.getByLabel("Copy page 메뉴",{exact:true}).click();
 for(const service of ["ChatGPT","Claude"]){const popupPromise=page.waitForEvent("popup");await page.getByRole("link",{name:`Open in ${service}`,exact:true}).click({noWaitAfter:true});const popup=await popupPromise;await popup.waitForLoadState();assert.ok(new URL(popup.url()).searchParams.get("q")?.includes("/docs/card"));await popup.close();}
 await page.getByLabel("Copy page 메뉴",{exact:true}).press("Escape");
 await page.evaluate(`Object.defineProperty(navigator.clipboard,"writeText",{configurable:true,value:async function(){throw new Error("denied");}})`);
 await page.getByRole("button",{name:"Copy page",exact:true}).click();const fallback=page.getByRole("textbox",{name:"직접 복사할 텍스트",exact:true});await expect(fallback).toBeFocused();assert.ok(await fallback.evaluate((el:HTMLTextAreaElement)=>el.selectionStart===0 && el.selectionEnd===el.value.length));checks.push({clipboardFallback:true});
 await page.goto(origin);await expect.poll(()=>page.evaluate(()=>window.__aingTools?.size ?? 0)).toBeGreaterThanOrEqual(8);await page.getByLabel("Agent 패널",{exact:true}).locator("summary").click();await page.getByRole("textbox",{name:"도구 검색",exact:true}).fill("chat_demo");await expect(page.getByRole("button",{name:/실행$/})).toHaveCount(2);checks.push({homeDefaultTools:true,search:true});
 await page.emulateMedia({reducedMotion:"reduce"});
 for(const name of ["","ai-chat","reaction-bar","card","tool-call","progress-tracker"]){await page.goto(name?`${origin}/docs/${name}`:origin);await expect.poll(()=>page.evaluate(()=>window.__aingTools?.size ?? 0)).toBeGreaterThan(0);await page.getByRole("button",{name:"라이트 / 다크 테마 전환",exact:true}).click();await expect.poll(()=>page.evaluate(()=>document.getAnimations().filter(a=>a.playState==="running").length)).toBe(0);await page.screenshot({path:`.verify/shots-v3/${name||"home"}-dark-1440.png`,fullPage:true});}
 const native=await browser.newContext({viewport:{width:1440,height:1000},permissions:["clipboard-read","clipboard-write"]});await native.addInitScript({content:`Object.defineProperty(document,"modelContext",{value:{registerTool:function(){}}})`});const nativePage=await native.newPage();await nativePage.goto(`${origin}/docs/card`);await expect.poll(()=>nativePage.evaluate(()=>window.__aingToolDefinitions?.size??0)).toBeGreaterThan(0);assert.equal(await nativePage.evaluate(()=>window.__aingTools?.size??0),0);await nativePage.getByLabel("Copy page 메뉴",{exact:true}).click();await nativePage.getByRole("button",{name:"Copy WebMCP tools",exact:true}).click();assert.ok(JSON.parse(await nativePage.evaluate(()=>navigator.clipboard.readText())).length>0);await native.close();checks.push({nativeDescriptorCopy:true});
 assert.deepEqual(errors,[]);await writeFile(".verify/foundation-browser-v3.json",JSON.stringify({passed:true,checks,consoleErrors:errors},null,2));console.log(`PASS: 6 motion sequences / 18 frames, 5 focus states, 5 pages x 6 copy/open entries, fallback, native descriptors, home search, dark/reduced-motion`);
} finally {await browser.close();}
