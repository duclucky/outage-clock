import test from 'node:test';import assert from 'node:assert/strict';
import{successful,nativeChild}from'../scripts/receipts.mjs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {requireSemanticGate} from '../scripts/promotion_gate.mjs';
import {rpcRead} from '../scripts/rpc_read.mjs';
import {deadlineFetch} from '../scripts/rpc_deadline.mjs';
import {identity,balance} from '../scripts/network.mjs';
const sender='0x'+'1'.repeat(40),recipient='0x'+'2'.repeat(40);
test('raw successful receipt projects only safe fields',()=>{
 const p=successful({status:'FINALIZED',result_name:'MAJORITY_AGREE',to_address:sender,consensus_data:{leader_receipt:[{execution_result:'SUCCESS',node_config:{secret:'synthetic'}}]}},'hash');
 assert.equal(p.executionResult,'SUCCESS');assert.equal(JSON.stringify(p).includes('synthetic'),false);
});
test('normalized SDK success and numeric finality',()=>assert.equal(successful({status:7,resultName:'AGREE',txExecutionResultName:'SUCCESS',contractAddress:sender},'hash').status,'FINALIZED'));
for(const bad of[{status:'FINALIZED'},{status:'ACCEPTED',execution_result:'SUCCESS'},{status:'FINALIZED',execution_result:'ERROR'},{status:'FINALIZED',execution_result:'SUCCESS',result_name:'UNDETERMINED'}])test('invalid or pending execution cannot succeed '+JSON.stringify(bad),()=>assert.throws(()=>successful(bad,'hash')));
const raw={status:'FINALIZED',from_address:sender,to_address:recipient,value:(10n**18n).toString(),triggered_by:'parent'};
const expected={sender,recipient,valueGEN:'1',parentHash:'parent'};
test('native child without VM result still binds exact1GEN origin and parent',()=>assert.equal(nativeChild(raw,'child',expected).valueGEN,'1'));
for(const field of ['status','from_address','to_address','value','triggered_by'])test('native transfer missing '+field+' rejects',()=>{const changed={...raw};delete changed[field];assert.throws(()=>nativeChild(changed,'child',expected));});
test('explicit native child failure rejects',()=>assert.throws(()=>nativeChild({...raw,error:'synthetic failure'},'child',expected)));

for(const exitCode of[0,7])test('local tool combines diagnostic streams and preserves exit '+exitCode,()=>{
 const python=path.resolve('.venv/Scripts/python.exe');
 const program=`import sys;print('synthetic stdout');sys.stderr.write('synthetic INFO\\n');sys.exit(${exitCode})`;
 const r=spawnSync(python,['scripts/local_tool.py',python,'-c',program],{encoding:'utf8'});
 assert.equal(r.status,exitCode);assert.equal(r.stderr,'');
 assert.ok(r.stdout.includes('synthetic INFO'));assert.ok(r.stdout.includes('synthetic stdout'));
});

function passingGate(version='OC_V5'){
 const runs=version==='OC_V6'?56:48,batchCount=version==='OC_V6'?20:16;
 const batches=Array.from({length:batchCount},(_,i)=>({results:Array.from({length:version==='OC_V6'&&i%10===9?1:3},(_,j)=>({id:`S${i*3+j}`,expected:{interval:'NOT_APPLIES'},observed:{interval:'NOT_APPLIES'},exactMatch:true,unsafeDefinite:false,conservativeAbstention:false}))}));
 const benchmark={complete:true,revision:version,productionSHA256:'source',corpusSHA256:'corpus',diagnosticSHA256:'probe',batches,
  summary:{plannedCaseRuns:runs,completedCaseRuns:runs,exactMatches:runs,unsafeDefinite:0,conservativeAbstentions:0,failedBatches:0,unobservedDueToBatchFailure:0}};
 const verified={semanticReadiness:'FINITE_CORPUS_ONLY',revision:version,candidateSourceSHA256:'source',corpusSHA256:'corpus',diagnosticSHA256:'probe',summary:{exactMatches:runs},
  batches:Array.from({length:batchCount},()=>({status:'FINALIZED',executionResult:'SUCCESS',consensusResult:'MAJORITY_AGREE',sourceMatches:true,nativeBalanceGEN:'0'}))};
 return {benchmark,verified};
}
test('complete bound48-run semantic evidence permits promotion',()=>{
 const {benchmark,verified}=passingGate();assert.equal(requireSemanticGate('OC_V5','source',benchmark,verified).runs,48);
});
test('V6 requires all56 observations and cannot reuse the48-run predecessor',()=>{
 const {benchmark,verified}=passingGate('OC_V6');assert.equal(requireSemanticGate('OC_V6','source',benchmark,verified).runs,56);
 const old=passingGate();assert.throws(()=>requireSemanticGate('OC_V6','source',old.benchmark,old.verified));
 benchmark.batches.at(-1).results.pop();assert.throws(()=>requireSemanticGate('OC_V6','source',benchmark,verified));
});
for(const defect of ['pending','unsafe','abstention','missing_case','wrong_meaning_hidden_by_summary','wrong_source','no_majority','nonzero_balance','stale_corpus'])test('semantic promotion rejects '+defect,()=>{
 const {benchmark:b,verified:v}=passingGate();
 if(defect==='pending')b.complete=false;
 else if(defect==='unsafe')b.summary.unsafeDefinite=1;
 else if(defect==='abstention')b.summary.conservativeAbstentions=1;
 else if(defect==='missing_case')b.batches[0].results.pop();
 else if(defect==='wrong_meaning_hidden_by_summary')b.batches[0].results[0].observed.interval='APPLIES';
 else if(defect==='wrong_source')v.batches[0].sourceMatches=false;
 else if(defect==='no_majority')v.batches[0].consensusResult='MAJORITY_DISAGREE';
 else if(defect==='nonzero_balance')v.batches[0].nativeBalanceGEN='1';
 else if(defect==='stale_corpus')v.corpusSHA256='changed';
 assert.throws(()=>requireSemanticGate('OC_V5','source',b,v));
});

test('RPC reader bounds a stalled request without retrying or signing',async()=>{
 let calls=0;
 const fetcher=(_url,options)=>new Promise((_resolve,reject)=>{
  calls++;options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true});
 });
 // Keep the event loop alive independently of AbortSignal.timeout's unref timer.
 const keeper=setTimeout(()=>{},1000);
 try{await assert.rejects(rpcRead('https://example.invalid','eth_getTransactionByHash',['synthetic'],{fetcher,timeoutMS:20}),{name:'TimeoutError'});}
 finally{clearTimeout(keeper);}
 assert.equal(calls,1);
});
test('RPC reader rejects mutations before any request',async()=>{
 let called=false;
 await assert.rejects(rpcRead('https://example.invalid','eth_sendRawTransaction',[],{fetcher:()=>{called=true;}}));
 assert.equal(called,false);
});
test('RPC errors retain only a safe code',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>({error:{code:-32001,message:'synthetic private diagnostic',data:{secret:'synthetic'}}})});
 await assert.rejects(rpcRead('https://example.invalid','eth_chainId',[],{fetcher}),e=>e.code===-32001&&!e.message.includes('synthetic')&&!Object.hasOwn(e,'data'));
});

test('SDK RPC deadline also bounds response body consumption',async()=>{
 const fetcher=async(_input,options)=>({json:()=>new Promise((_resolve,reject)=>{if(options.signal.aborted)reject(options.signal.reason);else options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true});})});
 const bound=deadlineFetch(fetcher,'https://rpc.invalid',20),keeper=setTimeout(()=>{},1000);
 try{const response=await bound('https://rpc.invalid',{method:'POST'});await assert.rejects(response.json(),{name:'TimeoutError'});}
 finally{clearTimeout(keeper);}
});
test('SDK deadline preserves caller cancellation and leaves other URLs alone',async()=>{
 const controller=new AbortController();let seen;
 const bound=deadlineFetch(async(_input,options)=>{seen=options;return null;},'https://rpc.invalid');
 await bound('https://rpc.invalid',{signal:controller.signal,method:'POST',body:'synthetic'});
 controller.abort();assert.equal(seen.signal.aborted,true);assert.equal(seen.body,'synthetic');
 const other={method:'GET'};await bound('https://source.invalid',other);assert.equal(seen,other);assert.equal(seen.signal,undefined);
});
for(const operation of ['identity','balance'])test('SDK '+operation+' errors do not log RPC payloads',async()=>{
 const originalError=console.error,originalWarn=console.warn,logged=[];
 console.error=console.warn=(...args)=>logged.push(args);
 const reader={request:async()=>{console.error({node_config:{secret:'synthetic'}});throw Error('synthetic RPC failure');}};
 try{await assert.rejects(operation==='identity'?identity(reader):balance(reader,recipient));assert.deepEqual(logged,[]);}
 finally{console.error=originalError;console.warn=originalWarn;}
});
