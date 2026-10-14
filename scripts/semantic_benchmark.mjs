// Bounded no-custody benchmark. Does not write to the production contract.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {keccak256} from 'viem';
import {ROOT,RPC,client,actors,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {receipt} from './receipts.mjs';
import {rpcRead} from './rpc_read.mjs';

try {
 const reader=client(); await identity(reader);
 const revision=process.argv[2]??'OC_V2';
 if(!['OC_V2','OC_V3','OC_V4','OC_V5','OC_V6','OC_V7','OC_V8'].includes(revision))throw Error('Unknown benchmark revision');
 const fromBatch=Number(process.argv[3]??'1'),signerRole=process.argv[4]??'issuer';
 const observeOnly=process.argv[5]==='observe-only';
 if(process.argv[5]&&!observeOnly)throw Error('Unknown observation mode');
 if(!Number.isInteger(fromBatch)||fromBatch<1||!['issuer','buyer'].includes(signerRole))throw Error('Bounded resume options required');
 const suffix=revision==='OC_V2'?'':`-v${revision.slice(-1)}`;
 const corpusSuffix=revision==='OC_V2'?'':['OC_V5','OC_V6','OC_V7','OC_V8'].includes(revision)?`-v${revision.slice(-1)}`:'-v3';
 const corpus=JSON.parse(fs.readFileSync(path.join(ROOT,`tests/data/semantic-scenarios${corpusSuffix}.json`),'utf8'));
 if(fromBatch>Math.ceil(corpus.cases.length/3)*2)throw Error('Resume batch exceeds frozen plan');
 const versionedProbe=path.join(ROOT,`.codex/semantic_probe_${revision}.py`);
 const source=fs.readFileSync(fs.existsSync(versionedProbe)?versionedProbe:path.join(ROOT,'.codex/semantic_probe.py'));
 const fidelityPath=path.join(ROOT,`.codex/semantic-probe-fidelity-${revision}.json`);
 const fidelity=fs.existsSync(fidelityPath)?JSON.parse(fs.readFileSync(fidelityPath,'utf8')):null;
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const corpusHash=sha(JSON.stringify(corpus)),sourceHash=sha(source);
 if(fidelity&&fidelity.probeSHA256!==sourceHash)throw Error('Versioned semantic source/certificate mismatch');
 const name=`semantic-benchmark${suffix}-20261014.json`;
 let record=file(name)??{network:'studionet',chainId:61999,revision,valueGEN:'0',custody:false,
  kind:'SYNTHETIC_CORPUS_REAL_GENVM_FULL_CONSENSUS',corpusSHA256:corpusHash,
  diagnosticSHA256:sourceHash,productionSHA256:fidelity?.productionSHA256??sha(fs.readFileSync(path.join(ROOT,'contracts/outage_clock.py'))),
  repetitions:2,scenarios:corpus.cases.length,batches:[],startedAt:new Date().toISOString()};
 if(record.corpusSHA256!==corpusHash||record.diagnosticSHA256!==sourceHash)throw Error('Benchmark identity changed');
 const signerAccount=observeOnly?null:actors()[signerRole==='buyer'?1:0];
 for(let repetition=0;repetition<2;repetition++) for(let offset=0;offset<corpus.cases.length;offset+=3) {
  const cases=corpus.cases.slice(offset,offset+3),index=repetition*Math.ceil(corpus.cases.length/3)+offset/3;
  // Leave earlier pending batches intact and in the full planned denominator.
  // Only one writer may run; stop the previous observer before a resume.
  if(index<fromBatch-1)continue;
  if(observeOnly&&!record.batches[index]?.transactionHash)continue;
  let batch=record.batches[index];
  if(!batch){batch={repetition:repetition+1,caseIds:cases.map(x=>x.id),valueGEN:'0'};record.batches[index]=batch;save(name,record);}
  if(batch.complete)continue;
  // Expected classes/rationale never enter constructor arguments or prompts.
  const input=cases.map(({id,scope,rows})=>({id,scope,rows}));
  if(!batch.transactionHash){
   batch.signerRole=signerRole;save(name,record);
   const signer=client({...signerAccount,signTransaction:async(...args)=>{
    const signed=await signerAccount.signTransaction(...args);batch.transactionHash=keccak256(signed);batch.signedAt=new Date().toISOString();save(name,record);return signed;
   }});
   await safe(()=>signer.deployContract({code:new Uint8Array(source),args:[JSON.stringify(input)],leaderOnly:false}));
   console.log(JSON.stringify({stage:'BENCHMARK_SUBMITTED',batch:index+1,cases:batch.caseIds,repetition:repetition+1,valueGEN:'0',transactionHash:batch.transactionHash}));
  }
  // Read the persisted hash directly. A transient SDK wait/indexing failure
  // must not trigger resubmission or be mistaken for a completed model result.
  let raw;
  for(let poll=0;poll<(observeOnly?1:100);poll++){
   try{
    raw=await rpcRead(RPC,'eth_getTransactionByHash',[batch.transactionHash]);
    Object.assign(batch,receipt(raw,batch.transactionHash));save(name,record);
    if(batch.status==='FINALIZED')break;
   }catch(error){batch.lastPollErrorCode=Number.isInteger(error?.code)?error.code:null;save(name,record);}
   if(poll%10===0)console.log(JSON.stringify({stage:'BENCHMARK_PENDING',batch:index+1,status:batch.status??'NOT_INDEXED',transactionHash:batch.transactionHash}));
   if(!observeOnly)await new Promise(resolve=>setTimeout(resolve,6000));
  }
  if(observeOnly&&batch.status!=='FINALIZED')continue;
  if(batch.status!=='FINALIZED')throw Error('Benchmark still pending; resume saved hash');
  if(batch.executionResult==='SUCCESS'&&batch.consensusResult==='MAJORITY_AGREE'){
   const deployed=await safe(()=>reader.getContractCode(batch.contractAddress));
   if(sha(Buffer.from(deployed))!==sourceHash)throw Error('Diagnostic source mismatch');
   if(await balance(reader,batch.contractAddress)!=='0')throw Error('Diagnostic must hold zero GEN');
   const reports=await view(reader,batch.contractAddress,'get_report');
   if(!Array.isArray(reports)||reports.length!==cases.length)throw Error('Incomplete benchmark reports');
   batch.results=cases.map(c=>{
    const found=reports.filter(r=>r.id===c.id);if(found.length!==1)throw Error('Benchmark case coverage');
    const result=found[0],ids=c.rows.map(r=>r.id);
    if(Object.keys(result.classes).length!==ids.length||ids.some(id=>!Object.hasOwn(result.classes,id)))throw Error('Benchmark interval coverage');
    return {id:c.id,expected:c.expected,observed:result.classes,reason:result.reason,
     exactMatch:ids.every(id=>result.classes[id]===c.expected[id]),
     unsafeDefinite:ids.some(id=>result.classes[id]!==c.expected[id]&&result.classes[id]!=='UNVERIFIABLE'),
     conservativeAbstention:ids.some(id=>c.expected[id]!=='UNVERIFIABLE'&&result.classes[id]==='UNVERIFIABLE')};
   });
  }else batch.results=[];
  batch.complete=true;batch.observedAt=new Date().toISOString();save(name,record);
  console.log(JSON.stringify({stage:'BENCHMARK_RESULT',batch:index+1,status:batch.status,executionResult:batch.executionResult,consensusResult:batch.consensusResult,
   evaluated:batch.results.length,exact:batch.results.filter(x=>x.exactMatch).length,unsafeDefinite:batch.results.filter(x=>x.unsafeDefinite).length}));
 }
 const results=record.batches.flatMap(x=>x.results??[]),planned=corpus.cases.length*2;
 record.summary={plannedCaseRuns:planned,completedCaseRuns:results.length,
  unobservedDueToBatchFailure:planned-results.length,exactMatches:results.filter(x=>x.exactMatch).length,
  unsafeDefinite:results.filter(x=>x.unsafeDefinite).length,conservativeAbstentions:results.filter(x=>x.conservativeAbstention).length,
  failedBatches:record.batches.filter(x=>x.executionResult!=='SUCCESS'||!x.results?.length).length,
  absoluteFutureAccuracyProven:false};
 record.complete=record.batches.length===Math.ceil(corpus.cases.length/3)*2&&record.batches.every(b=>b.complete);
 if(record.complete)record.finishedAt=new Date().toISOString();save(name,record);console.log(JSON.stringify(record.summary));
 if(record.summary.exactMatches!==planned||record.summary.failedBatches)process.exitCode=1;
}catch(error){fail(error);}
