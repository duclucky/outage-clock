// Read-only semantic component projection. Never save/print whole RPC receipts.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {abi} from 'genlayer-js';
import {ROOT,client,identity,file,save,safe,view,balance,fail} from './network.mjs';
import {receipt} from './receipts.mjs';

const plain=value=>value instanceof Map?Object.fromEntries([...value].map(([k,v])=>[k,plain(v)])):
 Array.isArray(value)?value.map(plain):typeof value==='bigint'?Number(value):value;
try{
 const [revision='OC_V4',caseId='S02',repeat='2']=process.argv.slice(2);
 if(!['OC_V4','OC_V5','OC_V6','OC_V7'].includes(revision)||!/^(S\d{2}(T[0-2])?|C0[1-8])$/.test(caseId)||!['1','2'].includes(repeat))throw Error('Bounded component inspection required');
 const suffix=`v${revision.slice(-1)}`;
 const record=file(`semantic-benchmark-${suffix}-20261014.json`);
 const b=record.batches.find(x=>x.repetition===Number(repeat)&&x.caseIds.includes(caseId)&&x.complete);
 if(!b?.results?.length)throw Error('Completed observed case required');
 const r=client();await identity(r);
 const raw=await safe(()=>r.request({method:'eth_getTransactionByHash',params:[b.transactionHash]}));
 const status=receipt(raw,b.transactionHash);
 if(status.status!=='FINALIZED'||status.executionResult!=='SUCCESS'||status.consensusResult!=='MAJORITY_AGREE')throw Error('Final majority result absent');
 const reports=await view(r,b.contractAddress,'get_report');
 const canonical=reports.find(x=>x.id===caseId),stored=b.results.find(x=>x.id===caseId);
 if(!canonical||JSON.stringify(canonical.classes)!==JSON.stringify(stored.observed))throw Error('Canonical verdict changed');
 const code=await safe(()=>r.getContractCode(b.contractAddress));
 if(createHash('sha256').update(code).digest('hex')!==record.diagnosticSHA256)throw Error('Diagnostic source mismatch');
 const corpus=JSON.parse(fs.readFileSync(path.join(ROOT,`tests/data/semantic-scenarios-${revision==='OC_V4'?'v3':suffix}.json`),'utf8'));
 if(createHash('sha256').update(JSON.stringify(corpus)).digest('hex')!==record.corpusSHA256)throw Error('Frozen corpus identity changed');
 const expected=corpus.cases.find(x=>x.id===caseId),index=b.caseIds.indexOf(caseId);
 if(JSON.stringify(expected.expected)!==JSON.stringify(stored.expected))throw Error('Stored expectation changed');
 const leaders=raw.consensus_data?.leader_receipt;
 let selected;
 for(const leader of Array.isArray(leaders)?leaders:[leaders]){
  if(!leader?.calldata||!leader.eq_outputs?.[String(index)])continue;
  const args=abi.calldata.decode(Buffer.from(leader.calldata,'base64')).get('args');
  const input=JSON.parse(args[0]).find(x=>x.id===caseId);
  if(input?.scope!==expected.scope||JSON.stringify(input.rows)!==JSON.stringify(expected.rows))throw Error('Constructor scope/evidence binding mismatch');
  const encoded=Buffer.from(leader.eq_outputs[String(index)],'base64');
  if(encoded[0]!==0)continue;
  const result=plain(abi.calldata.decode(encoded.subarray(1)));
  if(JSON.stringify(result.classes)!==JSON.stringify(canonical.classes))continue;
  if(JSON.stringify(result.intervals)!==JSON.stringify(expected.rows)){
   // Calldata dictionaries are canonicalized; compare normalized key order.
   const normalize=x=>Array.isArray(x)?x.map(normalize):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,normalize(x[k])])):x;
   if(JSON.stringify(normalize(result.intervals))!==JSON.stringify(normalize(expected.rows)))throw Error('Reviewed evidence differs from locked corpus');
  }
  if(revision!=='OC_V4'&&(result.channel!==input.scope||result.assessments.some(a=>a&&a.channel!==input.scope)))throw Error('Returned semantic target binding mismatch');
  selected={input,result};break;
 }
 if(!selected)throw Error('Matching leader components not found');
 const proof={network:'studionet',chainId:61999,revision,caseId,repetition:Number(repeat),...status,
  canonicalChannel:selected.input.scope,constructorAndEvidenceMatch:true,sourceMatches:true,
  expected:stored.expected,observed:canonical.classes,intervals:expected.rows,
  assessments:selected.result.assessments.map(a=>a===null?null:Object.fromEntries(expected.rows.map(row=>[row.id,a.intervals[row.id]]))),
  ...(revision!=='OC_V4'?{returnedChannel:selected.result.channel,acknowledgedChannels:selected.result.assessments.map(a=>a?.channel??null),promptSHA256:selected.result.prompt_digests}:{}),
  sourceDigest:selected.result.source_digest,valueGEN:'0',custody:false,productionFundsAffected:false,
  nativeBalanceGEN:await balance(r,b.contractAddress),at:new Date().toISOString()};
 if(proof.nativeBalanceGEN!=='0')throw Error('Diagnostic balance must be zero');
 const name=`semantic-${caseId}-${suffix}-20261014.json`;
 save(name,proof);
 console.log(JSON.stringify(proof));
}catch(error){fail(error);}
