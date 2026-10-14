import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';import{parseUnits}from'viem';
import{ROOT,client,identity,file,save,safe,view,balance,fail}from'./network.mjs';import{successful,nativeChild}from'./receipts.mjs';
try{
 const r=client();await identity(r);const d=file('deployment.json');if(!d?.active)throw Error('No active deployment');
 const sha=x=>createHash('sha256').update(x).digest('hex');
 const source=await safe(()=>r.getContractCode(d.contractAddress));if(sha(source)!==d.sourceSHA256||sha(fs.readFileSync(path.join(ROOT,'contracts/outage_clock.py')))!==d.sourceSHA256)throw Error('Exact source mismatch');
 const schema=await safe(()=>r.getContractSchema(d.contractAddress));if(Object.keys(schema.methods??{}).length!==14||schema.methods.accept.payable!==true)throw Error('Metadata mismatch');
 const proof={network:'studionet',chainId:61999,contractAddress:d.contractAddress,sourceCommit:d.sourceCommit,sourceSHA256:d.sourceSHA256,sourceMatches:true,parentCount:0,childCount:0,cases:{}};
 for(const name of['affected','unaffected','pending','unpaid']){
  const c=file('lifecycle-'+name+'.json');if(!c?.complete||c.contractAddress!==d.contractAddress)throw Error('Incomplete case');
  const canonical={lease:await view(r,d.contractAddress,'get_lease',[c.leaseId]),clock:await view(r,d.contractAddress,'get_clock',[c.leaseId]),credit:await view(r,d.contractAddress,'get_credit',[c.leaseId]),steps:{}};
  if(canonical.lease.state!=='CLOSED'||canonical.credit.credit_gen!=='0'||canonical.lease.escrow_gen!=='0')throw Error('Case liability or closure');
  for(const [nameStep,s]of Object.entries(c.steps)){
   const raw=await safe(()=>r.request({method:'eth_getTransactionByHash',params:[s.transactionHash]}));
   const receipt=successful(raw,s.transactionHash);
   if(raw.from_address?.toLowerCase()!==s.sender.toLowerCase()||raw.to_address?.toLowerCase()!==d.contractAddress.toLowerCase()||BigInt(raw.value)!==parseUnits(s.valueGEN,18))throw Error('Origin target or amount mismatch');
   const step={...receipt,sender:s.sender,valueGEN:s.valueGEN};
   if(['exercise','recover','cancel'].includes(nameStep)){
    const candidate=raw.created_at??raw.createdAt??raw.timestamp;
    const time=typeof candidate==='string'?Date.parse(candidate.endsWith('Z')||/[+-]\d\d:\d\d$/.test(candidate)?candidate:candidate+'Z')/1000:NaN;
    if(!Number.isFinite(time))throw Error('Authoritative transaction time absent');
    step.transactionTimeUTC=candidate;
    if(nameStep==='exercise'){
     if(!(c.baseDeadline<time&&time<canonical.clock.effective_deadline))throw Error('After-nominal exercise time not proven');
     step.afterNominalBeforeEffective=true;
    }else{
     const due=nameStep==='cancel'?c.acceptDeadline:canonical.clock.verified?canonical.clock.effective_deadline:c.baseDeadline+c.cap;
     if(time<due)throw Error('Recovery/cancellation expiry not proven');
     step.entrypointExpiryProven=true;step.dueUTC=new Date(due*1000).toISOString();
    }
   }
   if(nameStep==='withdraw'){
    const childProof=s.nativeProof;if(!childProof?.transactionHash)throw Error('No child proof');
    const rawChild=await safe(()=>r.request({method:'eth_getTransactionByHash',params:[childProof.transactionHash]}));
    step.nativeChild=nativeChild(rawChild,childProof.transactionHash,{sender:d.contractAddress,recipient:s.sender,valueGEN:'1',parentHash:s.transactionHash});
    if(parseUnits(s.beforeContractGEN,18)-parseUnits(s.afterContractGEN,18)!==parseUnits('1',18)||parseUnits(s.afterRecipientGEN,18)-parseUnits(s.beforeRecipientGEN,18)!==parseUnits('1',18))throw Error('Exact recorded delta invalid');
    step.exactContractDecreaseGEN='1';step.exactRecipientIncreaseGEN='1';proof.childCount++;
   }
   canonical.steps[nameStep]=step;proof.parentCount++;
   await new Promise(resolve=>setTimeout(resolve,1050));
  }
  if(name==='affected'&&(!canonical.lease.exercised||canonical.clock.extension_seconds!==c.cap))throw Error('No restored exercise');
  if(name==='unaffected'&&(canonical.lease.exercised||canonical.clock.extension_seconds!==0))throw Error('Unaffected clock changed');
  if(name==='pending'&&(canonical.clock.verified||canonical.lease.exercised))throw Error('Pending proof false');
  proof.cases[name]=canonical;
 }
 proof.accounting=await view(r,d.contractAddress,'get_accounting');proof.nativeBalanceGEN=await balance(r,d.contractAddress);
 if(proof.parentCount!==20||proof.childCount!==3||proof.accounting.received_gen!=='3'||proof.accounting.withdrawn_gen!=='3'||proof.accounting.liability_gen!=='0'||proof.nativeBalanceGEN!=='0')throw Error('Final native conservation not proven');
 proof.verified=true;proof.verifiedAt=new Date().toISOString();save('verification.json',proof);
 console.log(JSON.stringify({verified:true,cases:4,parentCount:proof.parentCount,childCount:3,receivedGEN:'3',withdrawnGEN:'3',nativeBalanceGEN:'0',liabilityGEN:'0',exerciseAfterNominalExpiry:true}));
}catch(e){fail(e);}
