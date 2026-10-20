import { createToolDocument } from "./tool-dom";
import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {act,create,type ReactTestRenderer} from "react-test-renderer";
import {forms} from "../lib/catalog/forms";
import {listWebMCPTools,subscribeWebMCPTools,optionValues,result,type AingTool} from "../registry/aing/lib/webmcp";
Object.defineProperty(globalThis,"HTMLFormElement",{value:class {},configurable:true});
Object.defineProperty(globalThis,"IS_REACT_ACT_ENVIRONMENT",{value:true});
const events=new EventTarget(),tools=new Map<string,AingTool>();
Object.defineProperty(globalThis,"window",{value:Object.assign(events,{__aingTools:tools}),configurable:true});
const doc = createToolDocument();
Object.assign(doc,{addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events)});
Object.defineProperty(globalThis,"document",{value:doc,configurable:true});
const context={signal:new AbortController().signal};
test("forms catalog, registry and docs include ten complete components with default WebMCP",()=>{
 assert.equal(forms.length,10);
 const items=JSON.parse(readFileSync("registry/groups/forms.json","utf8")).items;
 assert.deepEqual(items.map((i:{name:string})=>i.name),forms.map(i=>i.name));
 for(const item of forms){assert.ok(item.code);assert.ok(item.props.length);assert.ok(item.tools.length);assert.equal(typeof item.demo,"function");}
 assert.ok(forms.find(i=>i.name==="label")!.tools[0][2].includes("등록하지"));
 assert.deepEqual(optionValues(<><div><option value="one"/><option value="disabled" disabled/></div><option value="two"/></>),["one","two"]);
});
test("native agent adapter uses registered descriptor, JSON input/output, events and errors",async()=>{
 const definition={name:"native",description:"native",inputSchema:JSON.stringify({type:"object",properties:{value:{type:"number"}}})};
 window.__aingToolDefinitions=new Map([["native",{...definition,inputSchema:{type:"object",properties:{}},annotations:{consequentialHint:true}}]]);let received:unknown,previousCalls=0,updates=0;
 const previous=()=>{previousCalls++;};
 doc.modelContext={registerTool:()=>{},getTools:()=>[definition],ontoolchange:previous,executeTool:async(tool,input)=>{assert.equal(tool,definition);received=JSON.parse(input);return JSON.stringify(result({ok:true}));}};
 const unsubscribe=subscribeWebMCPTools(()=>updates++);
 doc.modelContext.ontoolchange!(new Event("toolchange"));events.dispatchEvent(new Event("aing:tools"));
 assert.equal(previousCalls,1);assert.equal(updates,2);
 const [tool]=await listWebMCPTools();assert.equal(tool.annotations?.consequentialHint,true);assert.deepEqual(tool.inputSchema.properties,{value:{type:"number"}});assert.deepEqual(await tool.execute({value:42},context),result({ok:true}));assert.deepEqual(received,{value:42});
 const controller=new AbortController();controller.abort();await assert.rejects(async()=>tool.execute({},{signal:controller.signal}));
 doc.modelContext.executeTool=async()=>{throw new Error("native rejected");};await assert.rejects(async()=>tool.execute({},context),/native rejected/);
 unsubscribe();assert.equal(doc.modelContext.ontoolchange,previous);delete doc.modelContext;
});
test("AIChat pending message does not emit missing-key warnings",async()=>{
 const {AIChat}=await import("../registry/aing/ui/ai-chat");let root:ReactTestRenderer;const errors:string[]=[],original=console.error;console.error=(...args:unknown[])=>{errors.push(args.map(String).join(" "));};
 try{await act(async()=>{root=create(<AIChat webmcp={false} messages={[{id:"one",role:"assistant",content:"hello"}]} onSend={()=>{}}/>);});await act(async()=>{root.update(<AIChat webmcp={false} pending messages={[{id:"one",role:"assistant",content:"hello"},{id:"two",role:"assistant",content:"stream"}]} onSend={()=>{}}/>);});await act(async()=>root.unmount());}finally{console.error=original;}
 assert.deepEqual(errors.filter(error=>error.includes('unique "key"')),[]);
});
test("choice tools reject disabled/unknown options, respect disabled roots, update callbacks and unregister",async()=>{
 const {RadioGroup,RadioGroupItem}=await import("../registry/aing/ui/radio-group");
 const {Switch}=await import("../registry/aing/ui/switch");
 const {Checkbox}=await import("../registry/aing/ui/checkbox");
 const {Slider}=await import("../registry/aing/ui/slider");
 let next:unknown;
 const cases=[
  {render:(disabled=false)=><RadioGroup aria-label="choice" disabled={disabled} onValueChange={v=>next=v}><RadioGroupItem value="one"/><RadioGroupItem value="two" disabled/></RadioGroup>,valid:{value:"one"},invalid:[{value:"two"},{value:2}],expected:"one"},
  {render:(disabled=false)=><Switch aria-label="choice" disabled={disabled} onCheckedChange={v=>next=v}/>,valid:{checked:true},invalid:[{checked:"true"}],expected:true},
  {render:(disabled=false)=><Checkbox aria-label="choice" disabled={disabled} onCheckedChange={v=>next=v}/>,valid:{checked:true},invalid:[{checked:"true"}],expected:true},
  {render:(disabled=false)=><Slider aria-label="choice" disabled={disabled} min={10} max={30} step={5} defaultValue={[15]} onValueChange={v=>next=v}/>,valid:{value:20},invalid:[{value:9},{value:31},{value:12},{value:NaN}],expected:[20]},
 ];
 for(const c of cases){let root:ReactTestRenderer;await act(async()=>{root=create(c.render());});const tool=[...tools.values()][0];assert.ok(tool);for(const input of c.invalid)await assert.rejects(async()=>tool.execute(input,context));await act(async()=>{await tool.execute(c.valid,context);});assert.deepEqual(next,c.expected);await act(async()=>root.update(c.render(true)));await assert.rejects(async()=>tools.get(tool.name)!.execute(c.valid,context));await act(async()=>root.unmount());assert.equal(tools.size,0);await assert.rejects(async()=>tool.execute(c.valid,context));}
});

test("slider agent commits once and enforces distance between handles",async()=>{
 const {Slider}=await import("../registry/aing/ui/slider");let root:ReactTestRenderer;const commits:number[][]=[];
 await act(async()=>{root=create(<Slider min={10} max={100} step={5} defaultValue={[20,40]} minStepsBetweenThumbs={2} onValueCommit={value=>commits.push(value)}/>);});
 const tool=[...tools.values()][0];await assert.rejects(async()=>tool.execute({value:35},context));
 await act(async()=>{await tool.execute({value:30},context);});assert.deepEqual(commits,[[30,40]]);
 await act(async()=>root.unmount());
});
