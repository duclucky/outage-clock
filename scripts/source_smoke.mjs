// Full authentic source acquisition + semantic review, no lease/payment/custody.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {keccak256} from 'viem';
import {ROOT,RPC,client,actors,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {rpcRead} from './rpc_read.mjs';
import {receipt} from './receipts.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
try{
 const revision=process.argv[2]??'OC_V6',r=client();await identity(r);
 if(!['OC_V6','OC_V7','OC_V8'].includes(revision))throw Error('Known live-source revision required');
 const source=fs.readFileSync(path.join(ROOT,`.codex/source_probe_${revision}.py`));
 const certificate=JSON.parse(fs.readFileSync(path.join(ROOT,`.codex/source-probe-fidelity-${revision}.json`),'utf8'));
 const productionSHA=sha(fs.readFileSync(path.join(ROOT,'contracts/outage_clock.py')));
 if(certificate.productionSHA256!==productionSHA||certificate.probeSHA256!==sha(source))throw Error('Live source smoke identity mismatch');
 const scopes={affected:'Access GPT-6.1 Sol specifically through Codex and ChatGPT Work mode. Officially reported degraded performance impedes this agreed channel.',
  unaffected:'Fetch current organization Costs data through the Compliance API. GPT-6.1 Sol performance in Codex or ChatGPT Work mode is outside this agreed channel.'};
 const ids=['01M4T4ZCM54D3ZPTQXRSWFG0XS'];
 const name=`live-source-smoke-v${revision.slice(-1)}-20261014.json`;
 const record=file(name)??{network:'studionet',chainId:61999,revision,productionSHA256:productionSHA,diagnosticSHA256:sha(source),
  kind:'AUTHORITATIVE_FEED_REAL_GENVM_FULL_CONSENSUS_NO_CUSTODY',scopes,incidentIds:ids,valueGEN:'0',custody:false,startedAt:new Date().toISOString()};
 if(record.productionSHA256!==productionSHA||record.diagnosticSHA256!==sha(source))throw Error('Saved live smoke identity changed');
 if(!record.transactionHash){
  const account=actors()[0];
  const signer=client({...account,signTransaction:async(...args)=>{const signed=await account.signTransaction(...args);record.transactionHash=keccak256(signed);save(name,record);return signed;}});
  await safe(()=>signer.deployContract({code:new Uint8Array(source),args:[JSON.stringify(scopes),JSON.stringify(ids)],leaderOnly:false}));
  console.log(JSON.stringify({stage:'SOURCE_SMOKE_SUBMITTED',transactionHash:record.transactionHash,valueGEN:'0'}));
 }
 for(let poll=0;poll<100;poll++){
  try{Object.assign(record,receipt(await rpcRead(RPC,'eth_getTransactionByHash',[record.transactionHash]),record.transactionHash));save(name,record);if(record.status==='FINALIZED')break;}
  catch(error){record.lastReadErrorType=['TimeoutError','AbortError','TypeError','Error'].includes(error?.name)?error.name:'ReadError';save(name,record);}
  if(poll%5===0)console.log(JSON.stringify({stage:'SOURCE_SMOKE_PENDING',status:record.status??'NOT_INDEXED'}));
  await new Promise(resolve=>setTimeout(resolve,6000));
 }
 if(record.status!=='FINALIZED')throw Error('Source smoke pending; resume original hash');
 if(record.executionResult!=='SUCCESS'||record.consensusResult!=='MAJORITY_AGREE'){
  record.passed=false;record.failure='CONSENSUS_NOT_AGREED';record.observedAt=new Date().toISOString();save(name,record);
  throw Error('Source smoke consensus failed');
 }
 record.sourceMatches=sha(Buffer.from(await safe(()=>r.getContractCode(record.contractAddress))))===sha(source);
 record.nativeBalanceGEN=await balance(r,record.contractAddress);
 record.reports=await view(r,record.contractAddress,'get_report');
 const a=record.reports.affected,u=record.reports.unaffected;
 record.passed=record.sourceMatches&&record.nativeBalanceGEN==='0'&&a?.source_ok&&u?.source_ok&&a.verified&&u.verified&&
  a.applicable_seconds>300&&u.applicable_seconds===0&&Object.values(u.classes).every(c=>c==='NOT_APPLIES');
 record.observedAt=new Date().toISOString();save(name,record);
 console.log(JSON.stringify({stage:'SOURCE_SMOKE_RESULT',status:record.status,executionResult:record.executionResult,consensusResult:record.consensusResult,
  sourceMatches:record.sourceMatches,nativeBalanceGEN:record.nativeBalanceGEN,passed:record.passed,reports:record.reports}));
 if(!record.passed)process.exitCode=1;
}catch(error){fail(error);}
