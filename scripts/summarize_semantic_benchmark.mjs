// Read-only network re-verification and finite-corpus scoring; no signing.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ROOT,client,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {receipt} from './receipts.mjs';

try{
 const r=client();await identity(r);
 const record=file('semantic-benchmark-20261014.json');
 if(!record?.complete)throw Error('Benchmark must finish first');
 const corpus=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/data/semantic-scenarios.json'),'utf8'));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 if(sha(JSON.stringify(corpus))!==record.corpusSHA256)throw Error('Locked corpus changed');
 const verification={network:'studionet',chainId:61999,at:new Date().toISOString(),batches:[],caseRuns:[],
  rubric:'Frozen synthetic conservative-policy expectations, not universal provider truth',absoluteFutureAccuracyProven:false};
 for(const b of record.batches){
  const raw=await safe(()=>r.request({method:'eth_getTransactionByHash',params:[b.transactionHash]}));
  const current=receipt(raw,b.transactionHash);
  if(current.status!=='FINALIZED'||current.executionResult!==b.executionResult||current.consensusResult!==b.consensusResult)throw Error('Batch evidence changed');
  const item={...current,valueGEN:'0',caseIds:b.caseIds,repetition:b.repetition};
  if(b.results.length){
   const code=await safe(()=>r.getContractCode(b.contractAddress));
   item.sourceMatches=sha(Buffer.from(code))===record.diagnosticSHA256;
   item.nativeBalanceGEN=await balance(r,b.contractAddress);
   if(!item.sourceMatches||item.nativeBalanceGEN!=='0')throw Error('Diagnostic identity/custody proof failed');
  }
  verification.batches.push(item);
  for(const result of b.results){
   const c=corpus.cases.find(c=>c.id===result.id),ids=c.rows.map(x=>x.id);
   verification.caseRuns.push({id:c.id,category:c.category,repetition:b.repetition,
    expected:result.expected,observed:result.observed,exactMatch:result.exactMatch,
    intervals:ids.length,correctIntervals:ids.filter(id=>result.observed[id]===c.expected[id]).length,
    unsafeDefinite:result.unsafeDefinite,conservativeAbstention:result.conservativeAbstention,
    transactionHash:b.transactionHash});
  }
  await new Promise(resolve=>setTimeout(resolve,1200));
 }
 verification.summary={...record.summary,correctIntervals:verification.caseRuns.reduce((n,x)=>n+x.correctIntervals,0),
  evaluatedIntervals:verification.caseRuns.reduce((n,x)=>n+x.intervals,0),plannedIntervals:corpus.cases.reduce((n,x)=>n+x.rows.length,0)*record.repetitions,
  stableRepeatedCases:corpus.cases.filter(c=>{
   const rows=verification.caseRuns.filter(x=>x.id===c.id);
   return rows.length===record.repetitions&&c.rows.every(row=>rows.every(x=>x.observed[row.id]===rows[0].observed[row.id]));
  }).length};
 const d=file('deployment.json');
 const deployedSHA256=sha(Buffer.from(await safe(()=>r.getContractCode(d.contractAddress))));
 verification.production={address:d.contractAddress,sourceUnchanged:sha(fs.readFileSync(path.join(ROOT,'contracts/outage_clock.py')))===record.productionSHA256&&deployedSHA256===record.productionSHA256,
  accounting:await view(r,d.contractAddress,'get_accounting'),nativeBalanceGEN:await balance(r,d.contractAddress)};
 if(!verification.production.sourceUnchanged||verification.production.nativeBalanceGEN!=='0'||verification.production.accounting.liability_gen!=='0')throw Error('Production boundary changed');
 verification.semanticReadiness=verification.summary.exactMatches!==verification.summary.plannedCaseRuns||verification.summary.failedBatches?'REVIEW_REQUIRED':'FINITE_CORPUS_ONLY';
 save('semantic-benchmark-verification-20261014.json',verification);
 console.log(JSON.stringify({summary:verification.summary,semanticReadiness:verification.semanticReadiness,production:verification.production}));
 // Execution/finality/CI success must never conceal a semantic rubric failure.
 if(verification.semanticReadiness==='REVIEW_REQUIRED')process.exitCode=1;
}catch(error){fail(error);}
