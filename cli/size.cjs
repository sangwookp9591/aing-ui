const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {gzipSync} = require('node:zlib');
const localRequire = createRequire(path.resolve('package.json'));
let esbuild;
try { esbuild = require(process.env.AING_ESBUILD_PATH || localRequire.resolve('esbuild')); }
catch { throw new Error('aing size needs esbuild 0.28.2. Use the npm aing wrapper or install esbuild@0.28.2 in this project.'); }
const rows=[];
const repository=fs.existsSync('registry/aing/ui/button.tsx')&&fs.existsSync('packages/core/src');
const config=repository?null:JSON.parse(fs.readFileSync('aing.json','utf8'));
const core=repository?'packages/core/src':path.join(path.dirname(localRequire.resolve('@aing/core/react')),'../src');
const modules={focus:1000,position:1500,dismiss:600,motion:1200,webmcp:1500,id:150,live:150};
const measure=async(entry,external)=>{
 const output=await esbuild.build({entryPoints:[entry],bundle:true,minify:true,write:false,format:'esm',external,alias:external.includes('@aing/core/*')?undefined:{'@aing/core/react':path.resolve(core,'react.tsx')},logLevel:'silent'});
 return gzipSync(output.outputFiles[0].contents,{level:9}).length;
};
(async()=>{
 for(const [name,budget] of Object.entries(modules)){const gzip=await measure(path.join(core,name+'.ts'),['react','react/*']);rows.push({name,gzip,budget,passed:gzip<=budget});}
 const total=rows.reduce((n,r)=>n+r.gzip,0);rows.push({name:'core total (sum)',gzip:total,budget:6000,passed:total<=6000});
 const entries=repository?['ui','tailwind'].flatMap(dir=>Object.entries({button:1000,dialog:3000,select:6000}).map(([name,budget])=>({name:name+(dir==='tailwind'?'-tailwind':''),entry:`registry/aing/${dir}/${name}.tsx`,budget}))):Object.entries(JSON.parse(fs.readFileSync('.aing/lock.json','utf8')).items).flatMap(([name,item])=>item.files.filter(file=>/\.[jt]sx?$/.test(file)).map(entry=>({name,entry,budget:({button:1000,dialog:3000,select:6000})[name.replace(/-tailwind$/,'')]??6000})));
 for(const {name,entry,budget} of entries){const lines=fs.readFileSync(entry,'utf8').trim().split('\n').length;const gzip=await measure(entry,['react','react/*','@aing/core/*']);rows.push({name:`${name} own (${lines} lines)`,gzip,budget,passed:gzip<=budget});rows.push({name:`${name} with core`,gzip:await measure(entry,['react','react/*']),budget:null,passed:null});}
 if(repository){for(const name of ['button','dialog','select']){const css=await esbuild.transform(fs.readFileSync('registry/aing/css/tokens.css','utf8')+fs.readFileSync(`registry/aing/css/${name}.css`,'utf8'),{loader:'css',minify:true});rows.push({name:`${name} CSS + tokens`,gzip:gzipSync(css.code,{level:9}).length,budget:null,passed:null});}}
 else{const css=await esbuild.transform(fs.readFileSync(config.css,'utf8'),{loader:'css',minify:true});rows.push({name:'installed CSS + tokens',gzip:gzipSync(css.code,{level:9}).length,budget:null,passed:null});}
 console.log(JSON.stringify(rows,null,2));if(process.env.AING_SIZE_BUDGET==='1'&&rows.some(row=>row.passed===false))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
