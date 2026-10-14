import test from 'node:test';import assert from 'node:assert/strict';
import{successful,nativeChild}from'../scripts/receipts.mjs';
const sender='0x'+'1'.repeat(40),recipient='0x'+'2'.repeat(40);
test('raw successful receipt projects only safe fields',()=>{
 const p=successful({status:'FINALIZED',result_name:'MAJORITY_AGREE',to_address:sender,consensus_data:{leader_receipt:[{execution_result:'SUCCESS',node_config:{secret:'synthetic'}}]}},'hash');
 assert.equal(p.executionResult,'SUCCESS');assert.equal(JSON.stringify(p).includes('synthetic'),false);
});
test('normalized SDK success and numeric finality',()=>assert.equal(successful({status:7,resultName:'AGREE',txExecutionResultName:'SUCCESS',contractAddress:sender},'hash').status,'FINALIZED'));
for(const bad of[{status:'FINALIZED'},{status:'ACCEPTED',execution_result:'SUCCESS'},{status:'FINALIZED',execution_result:'ERROR'},{status:'FINALIZED',execution_result:'SUCCESS',result_name:'UNDETERMINED'}])test('invalid or pending execution cannot succeed '+JSON.stringify(bad),()=>assert.throws(()=>successful(bad,'hash')));
const raw={status:'FINALIZED',from_address:sender,to_address:recipient,value:(10n**18n).toString(),triggered_by:'parent'};
const expected={sender,recipient,valueGEN:'1',parentHash:'parent'};
test('native child without VM result still binds exact1GEN origin and parent',()=>assert.equal(nativeChild(raw,'child',expected).valueGEN,'1'));
for(const field of ['status','from_address','to_address','value','triggered_by'])test('native transfer missing '+field+' rejects',()=>{const changed={...raw};delete changed[field];assert.throws(()=>nativeChild(changed,'child',expected));});
test('explicit native child failure rejects',()=>assert.throws(()=>nativeChild({...raw,error:'synthetic failure'},'child',expected)));
