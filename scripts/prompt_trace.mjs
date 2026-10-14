// Six prelocked no-custody controls, exact prompt argument inspection.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {keccak256} from 'viem';
import {ROOT,client,actors,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {receipt} from './receipts.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
try{
 const r=client();await identity(r);
 const cases=JSON.parse(fs.readFileSync(path.join(ROOT,'.codex/prompt-trace-cases.json'),'utf8'));
 const source=fs.readFileSync(path.join(ROOT,'.codex/prompt_trace.py'));
 const name='prompt-binding-diagnosis-20261014.json';
 const record=file(name)??{network:'studionet',chainId:61999,sourceSHA256:sha(source),casesSHA256:sha(JSON.stringify(cases)),valueGEN:'0',custody:false,batches:[],planned:6};
 if(record.sourceSHA256!==sha(source)||record.casesSHA256!==sha(JSON.stringify(cases)))throw Error('Diagnostic identity changed');
 const actor=actors()[0];
 for(let offset=0;offset<cases.length;offset+=3){
  const group=cases.slice(offset,offset+3),index=offset/3;
  let b=record.batches[index];
  if(!b){b={caseIds:group.map(c=>c.id)};record.batches[index]=b;save(name,record);}
  if(b.complete)continue;
  if(!b.transactionHash){
   const signer=client({...actor,signTransaction:async(...args)=>{const signed=await actor.signTransaction(...args);b.transactionHash=keccak256(signed);save(name,record);return signed;}});
   await safe(()=>signer.deployContract({code:new Uint8Array(source),args:[JSON.stringify(group.map(({id,scope,rows})=>({id,scope,rows})))],leaderOnly:false}));
   console.log(JSON.stringify({stage:'TRACE_SUBMITTED',batch:index+1,transactionHash:b.transactionHash,valueGEN:'0'}));
  }
  for(let poll=0;poll<100;poll++){
   try{Object.assign(b,receipt(await safe(()=>r.request({method:'eth_getTransactionByHash',params:[b.transactionHash]})),b.transactionHash));save(name,record);if(b.status==='FINALIZED')break;}catch(error){b.lastPollErrorCode=Number.isInteger(error?.code)?error.code:null;save(name,record);}
   if(poll%5===0)console.log(JSON.stringify({stage:'TRACE_PENDING',batch:index+1,status:b.status??'NOT_INDEXED'}));
   await new Promise(resolve=>setTimeout(resolve,6000));
  }
  if(b.status!=='FINALIZED')throw Error('Pending; resume original hash');
  b.results=[];
  if(b.executionResult==='SUCCESS'&&b.consensusResult==='MAJORITY_AGREE'){
   if(sha(Buffer.from(await safe(()=>r.getContractCode(b.contractAddress))))!==sha(source))throw Error('Deployed source differs');
   b.nativeBalanceGEN=await balance(r,b.contractAddress);if(b.nativeBalanceGEN!=='0')throw Error('Nonzero diagnostic balance');
   const reports=await view(r,b.contractAddress,'get_report');
   for(const c of group){
    const matches=reports.filter(x=>x.id===c.id);if(matches.length!==1)throw Error('Report coverage');
    const actual=matches[0];
    b.results.push({id:c.id,scope:c.scope,rows:c.rows,expected:c.expected,observed:actual.classes,promptArgumentsMatch:JSON.stringify(actual.prompt_trace)===JSON.stringify(c.expectedPrompts),promptSHA256:actual.prompt_trace.map(sha),exactMatch:Object.keys(c.expected).every(k=>actual.classes[k]===c.expected[k])});
   }
  }
  b.complete=true;save(name,record);console.log(JSON.stringify({stage:'TRACE_RESULT',batch:index+1,status:b.status,execution:b.executionResult,consensus:b.consensusResult,results:b.results}));
 }
 const results=record.batches.flatMap(b=>b.results);record.summary={planned:6,observed:results.length,exact:results.filter(x=>x.exactMatch).length,promptArgumentsMatch:results.length===6&&results.every(x=>x.promptArgumentsMatch),absoluteFutureAccuracyProven:false};record.at=new Date().toISOString();save(name,record);console.log(JSON.stringify(record.summary));
 if(record.summary.exact!==6||!record.summary.promptArgumentsMatch)process.exitCode=1;
}catch(error){fail(error);}
