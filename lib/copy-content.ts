import type { CatalogItem } from "./catalog";
export function mcpConfig(origin:string) {
 return {".mcp.json": {mcpServers:{shadcn:{command:"npx",args:["shadcn@4.22.1","mcp"]}}}, "components.json":{registries:{"@aing":`${origin}/r/{name}.json`}}};
}
export function agentPrompt(item:CatalogItem,origin:string) {
 return `다음 레지스트리에서 ${item.name}을 shadcn add 하고, 이 페이지의 사용 예대로 써 줘.\nnpx shadcn@4.22.1 add ${origin}/r/${item.name}.json\n\n${item.code}\n\nWebMCP 도구는 기본 등록되며 webmcp={false}로 끌 수 있어. ${item.tools.map(row=>row.join(" · ")).join("; ")}\n문서: ${origin}/docs/${item.name}`;
}
export function pageMarkdown(item:CatalogItem,origin:string) {
 const table=(head:string[],rows:readonly (readonly string[])[])=>[head.join(" | "),head.map(()=>"---").join(" | "),...rows.map(row=>row.map(cell=>cell.replaceAll("|","\\|")).join(" | "))].join("\n");
 return `# ${item.title}\n\n${item.ko}. ${item.description}\n\n## 설치\n\n\`\`\`sh\nnpx shadcn@4.22.1 add ${origin}/r/${item.name}.json\n\`\`\`\n\n## 사용 예\n\n\`\`\`tsx\n${item.code}\n\`\`\`\n\n## Props\n\n${table(["속성","타입","설명"],[...item.props,["webmcp?","false | {name?, description?}","기본 등록, false로 해제"],["toolName?","string","이름 재정의, 충돌 시 자동 접미사"]])}\n\n## WebMCP 도구\n\n${table(["이름","입력","동작·힌트"],item.tools)}\n\n${origin}/docs/${item.name}`;
}
