// Bounded no-custody benchmark. Does not write to the production contract.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {keccak256} from 'viem';
import {TransactionStatus} from 'genlayer-js/types';
import {ROOT,client,actors,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {receipt} from './receipts.mjs';

try {
 const reader=client(); await identity(reader);
 const corpus=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/data/semantic-scenarios.json'),'utf8'));
 const source=fs.readFileSync(path.join(ROOT,'.codex/semantic_probe.py'));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const corpusHash=sha(JSON.stringify(corpus)),sourceHash=sha(source);
 const name='semantic-benchmark-20261014.json';
 let record=file(name)??{network:'studionet',chainId:61999,valueGEN:'0',custody:false,
  kind:'SYNTHETIC_CORPUS_REAL_GENVM_FULL_CONSENSUS',corpusSHA256:corpusHash,
  diagnosticSHA256:sourceHash,productionSHA256:sha(fs.readFileSync(path.join(ROOT,'contracts/outage_clock.py'))),
  repetitions:2,scenarios:corpus.cases.length,batches:[],startedAt:new Date().toISOString()};
 if(record.corpusSHA256!==corpusHash||record.diagnosticSHA256!==sourceHash)throw Error('Benchmark identity changed');
 const signerAccount=actors()[0];
 for(let repetition=0;repetition<2;repetition++) for(let offset=0;offset<corpus.cases.length;offset+=3) {
  const cases=corpus.cases.slice(offset,offset+3),index=repetition*Math.ceil(corpus.cases.length/3)+offset/3;
  let batch=record.batches[index];
  if(!batch){batch={repetition:repetition+1,caseIds:cases.map(x=>x.id),valueGEN:'0'};record.batches[index]=batch;save(name,record);}
  if(batch.complete)continue;
  // Expected classes/rationale never enter constructor arguments or prompts.
  const input=cases.map(({id,scope,rows})=>({id,scope,rows}));
  if(!batch.transactionHash){
   const signer=client({...signerAccount,signTransaction:async(...args)=>{
    const signed=await signerAccount.signTransaction(...args);batch.transactionHash=keccak256(signed);batch.signedAt=new Date().toISOString();save(name,record);return signed;
   }});
   await safe(()=>signer.deployContract({code:new Uint8Array(source),args:[JSON.stringify(input)],leaderOnly:false}));
   console.log(JSON.stringify({stage:'BENCHMARK_SUBMITTED',batch:index+1,cases:batch.caseIds,repetition:repetition+1,valueGEN:'0',transactionHash:batch.transactionHash}));
  }
  try{await safe(()=>reader.waitForTransactionReceipt({hash:batch.transactionHash,status:TransactionStatus.FINALIZED,interval:6000,retries:90}));}catch{ /* inspect only safe fields below; never dump SDK error/config */ }
  const raw=await safe(()=>reader.request({method:'eth_getTransactionByHash',params:[batch.transactionHash]}));
  Object.assign(batch,receipt(raw,batch.transactionHash));save(name,record);
  if(batch.status!=='FINALIZED')throw Error('Benchmark still pending; resume saved hash');
  if(batch.executionResult==='SUCCESS'&&!['UNDETERMINED','MAJORITY_DISAGREE','DISAGREE'].includes(batch.consensusResult)){
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
 record.complete=true;record.finishedAt=new Date().toISOString();save(name,record);console.log(JSON.stringify(record.summary));
}catch(error){fail(error);}
