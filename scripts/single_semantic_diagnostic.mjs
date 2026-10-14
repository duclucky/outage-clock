// One separately prelocked control; never substitutes for the48-run campaign.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {keccak256} from 'viem';
import {ROOT,RPC,client,actors,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {rpcRead} from './rpc_read.mjs';
import {receipt} from './receipts.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
try{
 const r=client();await identity(r);
 const c=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/data/semantic-scenarios-v5.json'),'utf8')).cases.find(c=>c.id==='S02');
 const archived=path.join(ROOT,'.codex/semantic_probe_OC_V5.py');
 const source=fs.readFileSync(fs.existsSync(archived)?archived:path.join(ROOT,'.codex/semantic_probe.py'));
 const benchmark=file('semantic-benchmark-v5-20261014.json');
 if(sha(source)!==benchmark.diagnosticSHA256)throw Error('Campaign source binding required');
 const name='semantic-single-case-v5-20261014.json';
 const record=file(name)??{network:'studionet',chainId:61999,revision:'OC_V5',diagnosticSHA256:sha(source),productionSHA256:benchmark.productionSHA256,
  purpose:'SEPARATE_SINGLE_CASE_DIAGNOSTIC_NOT_CAMPAIGN_REPLACEMENT',caseId:c.id,expected:c.expected,valueGEN:'0',custody:false,plannedBeforeSubmission:true,startedAt:new Date().toISOString()};
 if(record.diagnosticSHA256!==sha(source))throw Error('Saved diagnostic identity differs');
 if(!record.transactionHash){
  const account=actors()[1];
  const signer=client({...account,signTransaction:async(...args)=>{const signed=await account.signTransaction(...args);record.transactionHash=keccak256(signed);save(name,record);return signed;}});
  save(name,record);
  await safe(()=>signer.deployContract({code:new Uint8Array(source),args:[JSON.stringify([{id:c.id,scope:c.scope,rows:c.rows}])],leaderOnly:false}));
  console.log(JSON.stringify({stage:'SINGLE_CONTROL_SUBMITTED',transactionHash:record.transactionHash,valueGEN:'0'}));
 }
 for(let poll=0;poll<100;poll++){
  try{Object.assign(record,receipt(await rpcRead(RPC,'eth_getTransactionByHash',[record.transactionHash]),record.transactionHash));save(name,record);if(record.status==='FINALIZED')break;}
  catch(error){record.lastReadErrorType=['TimeoutError','AbortError','TypeError','Error'].includes(error?.name)?error.name:'ReadError';save(name,record);}
  if(poll%5===0)console.log(JSON.stringify({stage:'SINGLE_CONTROL_PENDING',status:record.status??'NOT_INDEXED'}));
  await new Promise(resolve=>setTimeout(resolve,6000));
 }
 if(record.status!=='FINALIZED')throw Error('Control pending; resume saved hash');
 if(record.executionResult==='SUCCESS'&&record.consensusResult==='MAJORITY_AGREE'){
  record.sourceMatches=sha(Buffer.from(await safe(()=>r.getContractCode(record.contractAddress))))===sha(source);
  record.nativeBalanceGEN=await balance(r,record.contractAddress);
  if(!record.sourceMatches||record.nativeBalanceGEN!=='0')throw Error('Control source/custody differs');
  const reports=await view(r,record.contractAddress,'get_report');
  if(reports.length!==1||reports[0].id!==c.id)throw Error('Control coverage');
  record.observed=reports[0].classes;record.exactMatch=JSON.stringify(record.observed)===JSON.stringify(record.expected);
 }
 record.observedAt=new Date().toISOString();save(name,record);console.log(JSON.stringify(record));
 if(!record.exactMatch)process.exitCode=1;
}catch(error){fail(error);}
