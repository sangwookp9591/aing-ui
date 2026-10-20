import { release } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
await mkdir('.verify/gate', { recursive: true });
const results: {gate: string; passed: boolean | null; evidence: string}[] = [];
async function run(name: string, args: string[]) {
  console.log(`Running ${name}…`);
  const child = spawn('pnpm', args, { env: process.env, stdio: ['ignore','pipe','pipe'] });
  let output = ''; child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
  const code = await new Promise<number|null>(done => child.on('close', done));
  const evidence = `.verify/gate/${name}.log`; await writeFile(evidence, output);
  if(code !== 0) console.error(output.slice(-3000));
  return { passed: code === 0, evidence };
}
results.push({gate:'Core build',...await run('core-build',['core:build'])});
results.push({gate:'Preparation',...await run('prepare',['registry:build'])});
results.push({gate:'G1 · core and regression contracts',...await run('unit',['test:core'])});
results.push({gate:'Lint',...await run('lint',['lint'])});
results.push({gate:'Types',...await run('types',['exec','tsc','--noEmit'])});
results.push({gate:'Build',...await run('build',['build'])});
let server: ReturnType<typeof spawn> | undefined;
const port = process.env.VERIFY_PORT ?? '3210';
const origin = process.env.VERIFY_ORIGIN ?? 'http://localhost:' + port;
try {
  try { const response = await fetch(`${origin}/m1`); if(!response.ok) throw Error('Server unavailable'); }
  catch {
    if(process.env.VERIFY_ORIGIN) throw Error(`Cannot reach ${origin}`);
    server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port',port],{stdio:'ignore'});
    for(let i=0;i<80;i++){try{if((await fetch(`${origin}/m1`)).ok)break;}catch{}await new Promise(done=>setTimeout(done,250));}
  }
  process.env.VERIFY_ORIGIN = origin;
  const firefoxInCI = process.platform === 'darwin' && Number(release().split('.')[0]) >= 27;
  const projects = firefoxInCI ? ['--project','chromium','--project','webkit'] : [];
  await unlink('.verify/m1-browser.json').catch(error=>{if(error.code!=='ENOENT')throw error;});
  results.push({gate:'Browser command',...await run('browser',['exec','playwright','test',...projects])});
  if(firefoxInCI) results.push({gate:'Firefox · CI에서 검증',passed:null,evidence:'.github/workflows/gate.yml (macOS Darwin 27 profile/sandbox failure)'});
  const report = JSON.parse(await readFile('.verify/m1-browser.json','utf8'));
  const specs: {title: string;ok: boolean}[] = [];
  type Suite = { specs?: { title: string; ok: boolean }[]; suites?: Suite[] };
  function walk(suites: Suite[]) { for(const suite of suites){for(const spec of suite.specs ?? [])specs.push({title:spec.title,ok:spec.ok});walk(suite.suites ?? []);} }
  walk(report.suites);
  for(const gate of ['G2','G3','G4','G5']) {const matching=specs.filter(spec=>spec.title.includes(gate));results.push({gate,passed:matching.length >= (firefoxInCI ? 2 : 3)&&matching.every(spec=>spec.ok),evidence:'.verify/m1-browser.json'});}
  results.push({gate:'Docs · copy and Agent regression',...await run('docs',['exec','tsx','scripts/verify-m1-docs.ts'])});
  results.push({gate:'G6 · size',...await run('size',['size'])});
  const compat = await run('compat',['exec','tsx','scripts/compat.ts']);
  results.push({gate:'G7 · consumers',...compat},{gate:'G9 · fresh shadcn installation',...compat});
  if(spawnSync('which',['ego-browser']).status === 0) results.push({gate:'G8 · Ego native executeTool',...await run('native',['exec','tsx','scripts/ego-native.ts'])});
  results.push({gate:'G5 · Chromium hardware GPU',...await run('hardware',['exec','node','scripts/hardware-motion.mjs'])});
  if(spawnSync('which',['ego-browser']).status !== 0) results.push({gate:'G8 native · Ego Lite unavailable',passed:null,evidence:'WebMCP unit contracts ran in G1; native run requires Ego Lite'});
} catch(error) {results.push({gate:'Gate infrastructure',passed:false,evidence:String(error)});}
finally {server?.kill('SIGTERM');await writeFile('.verify/gate/results.json',JSON.stringify(results,null,2));console.table(results.map(row=>({...row,status:row.passed===null?'DEFERRED':row.passed?'PASS':'FAIL'})));}
if(results.some(result=>result.passed === false))process.exitCode=1;
