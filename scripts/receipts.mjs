import {formatUnits} from 'viem';
export function receipt(raw,hash){
 const leaders=raw?.consensus_data?.leader_receipt;
 const leader=Array.isArray(leaders)?leaders[0]:leaders;
 const execution=raw?.execution_result??raw?.txExecutionResultName??leader?.execution_result??null;
 const status=raw?.status===7||raw?.status==='7'?'FINALIZED':String(raw?.status??raw?.networkStatus??'UNKNOWN');
 const result=raw?.result_name??raw?.resultName??'UNKNOWN';
 const address=raw?.to_address??raw?.contractAddress??raw?.txDataDecoded?.contractAddress;
 return{transactionHash:hash,status,executionResult:execution,consensusResult:result,
  contractAddress:/^0x[0-9a-f]{40}$/i.test(address??'')?address:null};
}
export function successful(raw,hash){
 const proof=receipt(raw,hash);
 if(proof.status!=='FINALIZED'||proof.executionResult!=='SUCCESS'||['MAJORITY_DISAGREE','DISAGREE','UNDETERMINED','ERROR','CANCELED','TIMEOUT'].includes(proof.consensusResult))throw Error('No successful finality');
 return proof;
}
export function nativeChild(raw,hash,{sender,recipient,valueGEN,parentHash}){
 const status=raw?.status===7?'FINALIZED':String(raw?.status);
 const execution=raw?.execution_result??null;
 const amount=raw?.value===undefined?null:formatUnits(BigInt(raw.value),18);
 const from=raw?.from_address,to=raw?.to_address,parent=raw?.triggered_by;
 if(status!=='FINALIZED'||raw?.error||['ERROR','FAILURE','UNDETERMINED'].includes(execution)||from?.toLowerCase()!==sender.toLowerCase()||to?.toLowerCase()!==recipient.toLowerCase()||amount!==valueGEN||parent!==parentHash)throw Error('Native transfer proof incomplete');
 return{transactionHash:hash,status,sender:from,recipient:to,valueGEN:amount,parentHash:parent,executionResult:execution};
}
