import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../registry/aing/ui/button';
test('static disabled render links are inert HTML without client event handlers', () => {
  const html=renderToStaticMarkup(<Button webmcp={false} disabled render={<a href="/blocked">Disabled</a>}/>);
  assert.ok(html.includes('aria-disabled="true"')); assert.ok(html.includes('tabindex="-1"')); assert.ok(!html.includes('href='));
});
test('render callbacks compose in child-first order, honor prevention and block disabled actions', () => {
  const calls:string[]=[];
  const child=<button onClick={()=>calls.push('child')}>Save</button>;
  const composed=Button({webmcp:false,render:child,onClick:()=>calls.push('parent')});
  composed.props.children[0].props.onClick({defaultPrevented:false}); assert.deepEqual(calls,['child','parent']);
  const prevented=Button({webmcp:false,render:<button onClick={event=>event.preventDefault()}/>,onClick:()=>calls.push('blocked')});
  const event={defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){}};
  prevented.props.children[0].props.onClick(event); assert.deepEqual(calls,['child','parent']);
  const disabled=Button({webmcp:false,render:child,disabled:true,onClick:()=>calls.push('blocked')}); disabled.props.children[0].props.onClick(event); assert.deepEqual(calls,['child','parent']);
});
test('render keeps both React 19 refs and executes their cleanup', () => {
  let cleaned=false;const childRef={current:null as HTMLButtonElement|null};
  const parentRef=(_node:HTMLButtonElement|null)=>()=>{cleaned=true;};
  const rendered=Button({webmcp:false,ref:parentRef,render:<button ref={childRef}>Save</button>});
  const node={} as HTMLButtonElement;
  const cleanup=rendered.props.children[0].props.ref(node);
  assert.equal(childRef.current,node);cleanup();assert.equal(cleaned,true);assert.equal(childRef.current,null);
});
