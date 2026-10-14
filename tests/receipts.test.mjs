import test from 'node:test';import assert from 'node:assert/strict';
import{successful,nativeChild}from'../scripts/receipts.mjs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {requireSemanticGate} from '../scripts/promotion_gate.mjs';
import {rpcRead} from '../scripts/rpc_read.mjs';
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

function passingGate(){
 const batches=Array.from({length:16},(_,i)=>({results:Array.from({length:3},(_,j)=>({id:`S${i*3+j}`,expected:{interval:'NOT_APPLIES'},observed:{interval:'NOT_APPLIES'},exactMatch:true,unsafeDefinite:false,conservativeAbstention:false}))}));
 const benchmark={complete:true,revision:'OC_V5',productionSHA256:'source',corpusSHA256:'corpus',diagnosticSHA256:'probe',batches,
  summary:{plannedCaseRuns:48,completedCaseRuns:48,exactMatches:48,unsafeDefinite:0,conservativeAbstentions:0,failedBatches:0,unobservedDueToBatchFailure:0}};
 const verified={semanticReadiness:'FINITE_CORPUS_ONLY',revision:'OC_V5',candidateSourceSHA256:'source',corpusSHA256:'corpus',diagnosticSHA256:'probe',summary:{exactMatches:48},
  batches:Array.from({length:16},()=>({status:'FINALIZED',executionResult:'SUCCESS',consensusResult:'MAJORITY_AGREE',sourceMatches:true,nativeBalanceGEN:'0'}))};
 return {benchmark,verified};
}
test('complete bound48-run semantic evidence permits promotion',()=>{
 const {benchmark,verified}=passingGate();assert.equal(requireSemanticGate('OC_V5','source',benchmark,verified).runs,48);
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
