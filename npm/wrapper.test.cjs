const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const wrapper = path.join(__dirname,'aing/bin/aing.cjs');
test('wrapper forwards literal arguments and process exit code',()=>{
 const child=spawnSync(process.execPath,[wrapper,'-e','process.exit(process.argv[1] === "literal;$(nothing)" ? 7 : 9)','literal;$(nothing)'],{env:{...process.env,AING_BINARY:process.execPath},encoding:'utf8'});
 assert.equal(child.status,7,child.stderr);
});
test('wrapper reports missing executables with a failure status',()=>{
 const child=spawnSync(process.execPath,[wrapper],{env:{...process.env,AING_BINARY:path.join(__dirname,'does-not-exist')},encoding:'utf8'});
 assert.equal(child.status,1);assert.match(child.stderr,/aing:/);
});
