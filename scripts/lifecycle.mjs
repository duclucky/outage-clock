import {client,actors,identity,file,save,view,write,withdrawal,balance,fail}from'./network.mjs';
const INCIDENT='01M4T4ZCM54D3ZPTQXRSWFG0XS';
const scopes={affected:'Access GPT-6.1 Sol specifically through Codex and ChatGPT Work mode. Officially reported degraded performance impedes this agreed channel.',
 unaffected:'Fetch current organization Costs data through the Compliance API. GPT-6.1 Sol performance in Codex or ChatGPT Work mode is outside this agreed channel.'};
const now=()=>Math.floor(Date.now()/1000);
async function until(deadline,stage){while(now()<deadline){console.log(JSON.stringify({stage,remainingSeconds:deadline-now()}));await new Promise(resolve=>setTimeout(resolve,Math.min(25000,Math.max(1,deadline-now())*1000)));}}
try{
 const reader=client();await identity(reader);const d=file('deployment.json');if(!d?.active||d.executionResult!=='SUCCESS'||d.canonicalAccounting.received_gen!=='0')throw Error('Verified exact-source deployment smoke required');
 const accounts=actors();if(accounts[0].address.toLowerCase()===accounts[1].address.toLowerCase())throw Error('Role separation required');
 const name=process.argv[2];if(!['affected','unaffected','pending','unpaid'].includes(name))throw Error('Select bounded lifecycle case');
 const filename='lifecycle-'+name+'.json';let r=file(filename);
 if(!r){const t=now(),base=t+(name==='pending'?150:300),cap=name==='affected'?300:60;
  r={file:filename,network:'studionet',chainId:61999,contractAddress:d.contractAddress,sourceSHA256:d.sourceSHA256,case:name,
   leaseId:'oc-'+name+'-'+d.sourceSHA256.slice(0,8),issuer:accounts[0].address,buyer:accounts[1].address,
   scope:scopes[name==='unaffected'?'unaffected':'affected'],incidentIds:[INCIDENT],referenceStart:Date.parse('2026-10-13T08:10:00Z')/1000,
   referenceEnd:Date.parse('2026-10-13T16:36:42Z')/1000,acceptDeadline:t+(name==='pending'?60:150),baseDeadline:base,cap,steps:{},preparedAt:new Date().toISOString()};save(filename,r);
 }
 if(r.contractAddress!==d.contractAddress||r.sourceSHA256!==d.sourceSHA256)throw Error('Lifecycle identity mismatch');
 const address=d.contractAddress,id=r.leaseId;
 await write(reader,d,r,'create',accounts[0],'create_lease',[id,r.buyer,r.scope,JSON.stringify(r.incidentIds),r.referenceStart,r.referenceEnd,r.acceptDeadline,r.baseDeadline,r.cap]);
 let lease=await view(reader,address,'get_lease',[id]);
 if(name==='unpaid'){
  await until(r.acceptDeadline+2,'WAIT_UNPAID_CANCEL');await write(reader,d,r,'cancel',accounts[1],'cancel_unpaid',[id]);
 }else{
  await write(reader,d,r,'accept',accounts[1],'accept',[id,lease.digest],'1');
  if(name==='pending'){
   await until(r.baseDeadline+r.cap+2,'WAIT_HARD_RECOVERY');await write(reader,d,r,'recover',accounts[1],'recover',[id]);
   await withdrawal(reader,d,r,'withdraw',accounts[1],id);
  }else{
   // No blind semantic retry. A failed/undetermined review stays recorded for diagnosis.
   await write(reader,d,r,'review',accounts[1],'review_clock',[id]);
   r.clock=await view(reader,address,'get_clock',[id]);lease=await view(reader,address,'get_lease',[id]);
   r.attempt=await view(reader,address,'get_attempt',[lease.last_attempt]);save(filename,r);
   if(!r.clock.verified||r.attempt.outcome!=='READY')throw Error('Clock not verified; diagnose before retry');
   if(name==='affected'){
    if(r.clock.extension_seconds!==r.cap||r.clock.reported_seconds<=r.cap)throw Error('Expected real affected interval not observed');
    await until(r.baseDeadline+3,'WAIT_NOMINAL_EXPIRY');
    if(now()>=r.clock.effective_deadline-15)throw Error('Restored window too short; recover safely rather than late exercise');
    r.exerciseWallTime=now();save(filename,r);await write(reader,d,r,'exercise',accounts[1],'exercise',[id]);
    await withdrawal(reader,d,r,'withdraw',accounts[0],id);
   }else{
    if(r.clock.extension_seconds!==0)throw Error('Explicitly unaffected channel got time');
    await until(r.clock.effective_deadline+2,'WAIT_VERIFIED_EXPIRY');await write(reader,d,r,'recover',accounts[1],'recover',[id]);
    await withdrawal(reader,d,r,'withdraw',accounts[1],id);
   }
  }
 }
 await write(reader,d,r,'close',accounts[1],'close_lease',[id]);
 r.canonical={lease:await view(reader,address,'get_lease',[id]),clock:await view(reader,address,'get_clock',[id]),credit:await view(reader,address,'get_credit',[id]),accounting:await view(reader,address,'get_accounting'),nativeBalanceGEN:await balance(reader,address)};
 if(r.canonical.lease.state!=='CLOSED'||r.canonical.credit.credit_gen!=='0'||r.canonical.lease.escrow_gen!=='0'||r.canonical.accounting.liability_gen!=='0'||r.canonical.nativeBalanceGEN!=='0')throw Error('Final zero-liability closure missing');
 r.complete=true;r.verifiedAt=new Date().toISOString();save(filename,r);
 console.log(JSON.stringify({case:name,complete:true,state:'CLOSED',nativeBalanceGEN:r.canonical.nativeBalanceGEN,liabilityGEN:'0',clock:r.canonical.clock}));
}catch(e){fail(e);}
