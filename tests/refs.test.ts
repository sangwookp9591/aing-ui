import assert from 'node:assert/strict';
import {test} from 'node:test';
import {composeRefs} from '../packages/core/src/react';
test('merged React 19 refs preserve modern cleanup and legacy null notification',()=>{
  const node={id:'one'}, object:{current:typeof node|null}={current:null},calls:string[]=[];
  const attach=composeRefs<typeof node>(object,value=>{calls.push(value?'modern':'unexpected-null');return()=>{calls.push('cleanup');};},value=>{calls.push(value?'legacy':'legacy-null');},undefined);
  const cleanup=attach(node);assert.equal(object.current,node);assert.deepEqual(calls,['modern','legacy']);cleanup();assert.equal(object.current,null);assert.deepEqual(calls,['modern','legacy','cleanup','legacy-null']);
});
