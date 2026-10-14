import {client,file,view,balance,safe,fail} from './network.mjs';
import {successful,nativeChild} from './receipts.mjs';
import {parseUnits} from 'viem';
// V1 recovery executed at commit fc611f0. This final tool only re-verifies it.
try {
 const reader=client(),d=file('archive/v1/deployment.json'),r=file('archive/v1/recovery-flagged-v1.json');
 if(!d||d.active||!r?.complete||r.contractAddress!==d.contractAddress)throw Error('Archived recovered V1 identity required');
 for(const step of Object.values(r.steps)) {
  const raw=await safe(()=>reader.request({method:'eth_getTransactionByHash',params:[step.transactionHash]}));
  successful(raw,step.transactionHash);
 }
 const w=r.steps.withdraw,n=w.nativeProof;
 const rawChild=await safe(()=>reader.request({method:'eth_getTransactionByHash',params:[n.transactionHash]}));
 nativeChild(rawChild,n.transactionHash,{sender:d.contractAddress,recipient:w.sender,valueGEN:'1',parentHash:w.transactionHash});
 if(parseUnits(w.beforeContractGEN,18)-parseUnits(w.afterContractGEN,18)!==parseUnits('1',18)||parseUnits(w.afterRecipientGEN,18)-parseUnits(w.beforeRecipientGEN,18)!==parseUnits('1',18))throw Error('Archived exact delta invalid');
 const l=await view(reader,d.contractAddress,'get_lease',[r.leaseId]),a=await view(reader,d.contractAddress,'get_accounting');
 if(l.state!=='CLOSED'||l.exercised||a.liability_gen!=='0'||await balance(reader,d.contractAddress)!=='0')throw Error('Archived zero closure not proven');
 console.log(JSON.stringify({archivedV1Recovery:'REVERIFIED',refundedGEN:'1',nativeBalanceGEN:'0',liabilityGEN:'0',exercised:false,readOnly:true}));
}catch(error){fail(error);}
