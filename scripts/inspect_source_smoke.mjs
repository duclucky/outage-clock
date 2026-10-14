// Read-only rejected leader projection. This is never a canonical verdict.
import {abi} from 'genlayer-js';
import {client,identity,file,save,safe,fail} from './network.mjs';
import {receipt} from './receipts.mjs';
const plain=x=>x instanceof Map?Object.fromEntries([...x].map(([k,v])=>[k,plain(v)])):
 Array.isArray(x)?x.map(plain):typeof x==='bigint'?Number(x):x;
try{
 const revision=process.argv[2];if(!['OC_V6','OC_V7'].includes(revision))throw Error('Known source revision required');
 const suffix=`v${revision.slice(-1)}-20261014.json`,saved=file('live-source-smoke-'+suffix);
 if(!saved?.transactionHash)throw Error('Existing source smoke required');
 const r=client();await identity(r);
 const raw=await safe(()=>r.request({method:'eth_getTransactionByHash',params:[saved.transactionHash]}));
 const current=receipt(raw,saved.transactionHash);
 if(current.status!=='FINALIZED'||current.consensusResult!=='MAJORITY_DISAGREE')throw Error('Rejected finalized source smoke required');
 const leaders=raw.consensus_data?.leader_receipt,projections=[];
 for(const leader of Array.isArray(leaders)?leaders:[leaders]){
  if(!leader?.calldata)continue;
  const args=abi.calldata.decode(Buffer.from(leader.calldata,'base64')).get('args');
  const scopes=JSON.parse(args[0]),ids=JSON.parse(args[1]);
  if(JSON.stringify(scopes)!==JSON.stringify(saved.scopes)||JSON.stringify(ids)!==JSON.stringify(saved.incidentIds))throw Error('Source constructor binding mismatch');
  const outputs=[];
  for(const slot of ['0','1']){
   const encoded=leader.eq_outputs?.[slot];if(!encoded)continue;
   const bytes=Buffer.from(encoded,'base64');if(bytes[0]!==0)continue;
   const result=plain(abi.calldata.decode(bytes.subarray(1)));
   if(!Object.values(scopes).includes(result.channel))throw Error('Unrecognized reviewed channel');
   const fields=['title_scope','body_scope','title','body','body_kind','recovery','body_conflict'];
   outputs.push({slot,returnedChannel:result.channel,sourceOK:result.source_ok,stage:result.stage,
    classes:result.classes,sourceDigest:result.source_digest,promptSHA256:result.prompt_digests,
    assessments:result.assessments?.map(a=>a===null?null:{acknowledgedChannel:a.channel,
     intervals:Object.fromEntries(Object.entries(a.intervals??{}).map(([id,row])=>[id,Object.fromEntries(fields.map(k=>[k,row[k]]))]))})});
  }
  projections.push({executionResult:leader.execution_result,constructorMatches:true,outputs});
 }
 if(!projections.length)throw Error('No rejected leader evidence available');
 const proof={network:'studionet',chainId:61999,revision,...current,kind:'REJECTED_LEADER_DIAGNOSTIC_ONLY',
  canonicalVerdict:false,productionSHA256:saved.productionSHA256,diagnosticSHA256:saved.diagnosticSHA256,
  valueGEN:'0',custody:false,productionFundsAffected:false,projections,observedAt:new Date().toISOString()};
 save('live-source-rejected-'+suffix,proof);
 console.log(JSON.stringify({stage:'REJECTED_SOURCE_INSPECTED',...current,canonicalVerdict:false,leaders:projections.length,valueGEN:'0'}));
}catch(error){fail(error);}
