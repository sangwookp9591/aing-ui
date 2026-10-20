import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {catalog, catalogGroups} from "../lib/catalog";
import {agentPrompt, mcpConfig, pageMarkdown} from "../lib/copy-content";
import {toolName, accessibleText} from "../registry/aing/lib/webmcp";
test("catalog groups preserve the five AI demos and unique registry entries",()=>{
 assert.deepEqual(catalogGroups.find(group=>group.id==="ai")!.items.map(item=>item.name),
   ["ai-chat","reaction-bar","card","tool-call","progress-tracker"]);
 assert.deepEqual(catalogGroups.map(group=>group.id),["ai","forms","overlays","display"]);
 const items=["ai","forms","overlays","display"].flatMap(group=>JSON.parse(readFileSync(`registry/groups/${group}.json`,"utf8")).items);
 assert.equal(items.length,catalog.length+2);
 assert.equal(new Set(items.map(item=>item.name)).size,items.length);
 for(const item of catalog){assert.ok(items.some(entry=>entry.name===item.name));assert.equal(typeof item.demo,"function");}
});
test("copied content preserves usage and MCP separates server and registry configuration",()=>{
 const item=catalog[0],origin="https://aing.example";
 const markdown=pageMarkdown(item,origin);
 for(const heading of ["## 설치","## 사용 예","## Props","## WebMCP 도구"])assert.ok(markdown.includes(heading));
 assert.ok(markdown.includes(item.code));assert.ok(agentPrompt(item,origin).includes(`${origin}/r/ai-chat.json`));
 const config=mcpConfig(origin);
 assert.deepEqual(config[".mcp.json"].mcpServers.shadcn.args,["shadcn@4.22.1","mcp"]);
 assert.equal(config["components.json"].registries["@aing"],`${origin}/r/{name}.json`);
});
test("accessible labels yield readable slugs with id fallback and explicit name precedence",()=>{
 assert.equal(accessibleText(<><h3>Team inbox</h3><p>새 소식</p></>),"Team inbox 새 소식");
 assert.equal(toolName("card",":r0:",{},"_read","Team inbox"),"card_team_inbox_read");
 const korean = toolName("card",":r0:",{},"_read","메시지 반응".repeat(60));
 assert.match(korean,/^[a-zA-Z0-9_.-]{1,128}$/);assert.ok(korean.endsWith("_read"));
 assert.equal(toolName("card",":r0:",{},"_read",""),"card_r0_read");
 assert.equal(toolName("card",":r0:",{toolName:"custom",webmcp:{name:"override"}},"_read","Title"),"custom_read");
});
