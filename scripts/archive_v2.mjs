// Read-only network proof, then reversible local archive. No signing or value.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {EVIDENCE,client,identity,file,safe,view,balance,fail} from './network.mjs';

try{
 const d=file('deployment.json'),benchmark=file('semantic-benchmark-v4-20261014.json'),verified=file('semantic-benchmark-verification-v4-20261014.json');
 if(d?.version!=='OC_V2'||!d.active)throw Error('Only the known active OC_V2 can be archived');
 if(!benchmark?.complete||benchmark.summary?.exactMatches!==36||benchmark.summary?.failedBatches!==0)throw Error('Replacement semantic gate has not passed');
 if(verified?.semanticReadiness!=='FINITE_CORPUS_ONLY'||verified.candidateSourceSHA256!==benchmark.productionSHA256||verified.summary?.exactMatches!==36||verified.batches?.length!==12||verified.batches.some(b=>b.status!=='FINALIZED'||b.executionResult!=='SUCCESS'||b.consensusResult!=='MAJORITY_AGREE'))throw Error('Independent semantic re-verification pending or failed');
 const r=client();await identity(r);
 const source=await safe(()=>r.getContractCode(d.contractAddress));
 if(createHash('sha256').update(source).digest('hex')!==d.sourceSHA256)throw Error('Historical source mismatch');
 const proof={network:'studionet',chainId:61999,version:d.version,address:d.contractAddress,
  sourceCommit:d.sourceCommit,sourceSHA256:d.sourceSHA256,active:false,status:'SUPERSEDED_RECOVERED_ZERO',
  reason:'OC_V2 S08 violated the frozen conservative conflict rule; OC_V3 failed revalidation; OC_V4 finite semantic gate passed. Historical outcomes are not rewritten.',
  at:new Date().toISOString(),cases:{}};
 for(const name of ['affected','unaffected','pending','unpaid']){
  const c=file(`lifecycle-${name}.json`);
  if(!c?.complete||c.contractAddress!==d.contractAddress)throw Error('Missing historical lifecycle binding');
  const lease=await view(r,d.contractAddress,'get_lease',[c.leaseId]);
  const credit=await view(r,d.contractAddress,'get_credit',[c.leaseId]);
  if(lease.state!=='CLOSED'||lease.escrow_gen!=='0'||credit.credit_gen!=='0')throw Error('Old lease still has liability');
  proof.cases[name]={leaseId:c.leaseId,state:lease.state,escrowGEN:lease.escrow_gen,creditGEN:credit.credit_gen};
 }
 proof.accounting=await view(r,d.contractAddress,'get_accounting');
 proof.nativeBalanceGEN=await balance(r,d.contractAddress);
 if(proof.nativeBalanceGEN!=='0'||proof.accounting.liability_gen!=='0'||proof.accounting.escrow_gen!=='0'||proof.accounting.credit_gen!=='0')throw Error('Old revision not empty');
 const folder=path.join(EVIDENCE,'archive/v2');
 const names=['deployment.json','lifecycle-affected.json','lifecycle-unaffected.json','lifecycle-pending.json','lifecycle-unpaid.json','verification.json'];
 fs.mkdirSync(folder,{recursive:true});
 for(const name of names)if(fs.existsSync(path.join(folder,name)))throw Error('Archive target exists; inspect before moving');
 fs.writeFileSync(path.join(folder,'revision.json'),JSON.stringify(proof,null,2)+'\n');
 for(const name of names)fs.renameSync(path.join(EVIDENCE,name),path.join(folder,name));
 fs.writeFileSync(path.join(folder,'deployment.json'),JSON.stringify({...d,active:false,
  revisionStatus:proof.status,supersededAt:proof.at,supersededReason:proof.reason},null,2)+'\n');
 console.log(JSON.stringify({archived:true,version:'OC_V2',address:d.contractAddress,cases:4,nativeBalanceGEN:'0',liabilityGEN:'0'}));
}catch(error){fail(error);}
