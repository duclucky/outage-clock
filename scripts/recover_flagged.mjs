// Recover only the already-funded diagnostic product case; never creates/funds a lease.
import{client,actors,file,identity,save,view,write,withdrawal,balance,fail}from'./network.mjs';
try{
 const reader=client();await identity(reader);const d=file('deployment.json'),c=file('lifecycle-affected.json');
 if(!d?.active||!c||c.contractAddress!==d.contractAddress)throw Error('Flagged case identity missing');
 const name='recovery-flagged-v1.json';const record=file(name)??{file:name,network:'studionet',chainId:61999,contractAddress:d.contractAddress,sourceSHA256:d.sourceSHA256,leaseId:c.leaseId,reason:'Contradictory rationale and critical class; no exercise allowed',steps:{}};
 const account=actors()[1],clock=await view(reader,d.contractAddress,'get_clock',[c.leaseId]);
 while(Math.floor(Date.now()/1000)<clock.effective_deadline+2){console.log(JSON.stringify({stage:'WAIT_SAFE_REFUND',remainingSeconds:clock.effective_deadline+2-Math.floor(Date.now()/1000)}));await new Promise(resolve=>setTimeout(resolve,20000));}
 await write(reader,d,record,'recover',account,'recover',[c.leaseId]);
 await withdrawal(reader,d,record,'withdraw',account,c.leaseId);
 await write(reader,d,record,'close',account,'close_lease',[c.leaseId]);
 record.lease=await view(reader,d.contractAddress,'get_lease',[c.leaseId]);record.credit=await view(reader,d.contractAddress,'get_credit',[c.leaseId]);record.accounting=await view(reader,d.contractAddress,'get_accounting');record.nativeBalanceGEN=await balance(reader,d.contractAddress);
 if(record.lease.exercised||record.lease.state!=='CLOSED'||record.accounting.liability_gen!=='0'||record.nativeBalanceGEN!=='0')throw Error('Recovery not proven');
 record.complete=true;record.verifiedAt=new Date().toISOString();save(name,record);console.log(JSON.stringify({recovered:true,refundedGEN:'1',nativeBalanceGEN:'0',liabilityGEN:'0',exercised:false}));
}catch(e){fail(e);}
