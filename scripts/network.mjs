import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
import{createClient,createAccount}from'genlayer-js';import{studionet}from'genlayer-js/chains';
import{TransactionStatus}from'genlayer-js/types';import{formatUnits,keccak256}from'viem';
import{successful,nativeChild}from'./receipts.mjs';
import{deadlineFetch}from'./rpc_deadline.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const EVIDENCE=path.join(ROOT,'docs/evidence/studionet');
export const RPC='https://studio.genlayer.com/api',EXPLORER='https://explorer-studio.genlayer.com';
// Bound only the selected SDK RPC transport, keeping SDK/API versions intact.
// A broadcast timeout is ambiguous: saved signed hashes MUST be read, not replayed.
globalThis.fetch=deadlineFetch(globalThis.fetch,RPC);
export const client=account=>createClient({chain:studionet,endpoint:RPC,...(account?{account}:{})});
export function file(name){const p=path.join(EVIDENCE,name);return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;}
export function save(name,value){fs.mkdirSync(EVIDENCE,{recursive:true});const p=path.join(EVIDENCE,name);fs.writeFileSync(p+'.tmp',JSON.stringify(value,null,2)+'\n');fs.renameSync(p+'.tmp',p);}
export async function safe(operation){const error=console.error,warn=console.warn;console.error=console.warn=()=>{};try{return await operation();}finally{console.error=error;console.warn=warn;}}
export function actors(){const values={};for(const p of[path.join(ROOT,'.env'),path.join(ROOT,'..','.env')]){
 if(!fs.existsSync(p))continue;for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!values[m[1]])values[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
 }}return ['STUDIONET_PRIVATE_KEY','STUDIONET_INTEGRATOR_PRIVATE_KEY'].map(name=>{let key=values[name];if(!/^(0x)?[0-9a-f]{64}$/i.test(key??''))throw Error('Authorized configuration unavailable');return createAccount(key.startsWith('0x')?key:'0x'+key);});}
export async function identity(reader){if(studionet.id!==61999||Number(BigInt(await safe(()=>reader.request({method:'eth_chainId',params:[]}))))!==61999)throw Error('Wrong network');}
export async function view(reader,address,name,args=[]){const x=await safe(()=>reader.readContract({address,functionName:name,args,stateStatus:'finalized'}));return typeof x==='string'?JSON.parse(x):x;}
export async function balance(reader,address){return formatUnits(BigInt(await safe(()=>reader.request({method:'eth_getBalance',params:[address,'latest']}))),18);}
export async function wait(reader,hash){await safe(()=>reader.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:4000,retries:100}));const raw=await safe(()=>reader.request({method:'eth_getTransactionByHash',params:[hash]}));return{proof:successful(raw,hash),raw};}
export async function write(reader,d,record,key,account,name,args=[],valueGEN='0'){
 let step=record.steps[key];if(!step){step={method:name,args,sender:account.address,valueGEN,beforeContractGEN:await balance(reader,d.contractAddress)};record.steps[key]=step;save(record.file,record);}
 if(step.method!==name||JSON.stringify(step.args)!==JSON.stringify(args)||step.sender.toLowerCase()!==account.address.toLowerCase()||step.valueGEN!==valueGEN)throw Error('Operation identity mismatch');
 if(!step.transactionHash){
  const value=BigInt(valueGEN)*10n**18n;
  const signer=client({...account,signTransaction:async(...signArgs)=>{const signed=await account.signTransaction(...signArgs);step.transactionHash=keccak256(signed);step.signedAt=new Date().toISOString();save(record.file,record);return signed;}});
  await safe(()=>signer.writeContract({address:d.contractAddress,functionName:name,args,value}));
  console.log(JSON.stringify({step:key,method:name,valueGEN,transactionHash:step.transactionHash,status:'SUBMITTED'}));
 }
 const{proof,raw}=await wait(reader,step.transactionHash);Object.assign(step,proof);save(record.file,record);
 if(valueGEN==='1'&&!step.depositVerified){step.afterContractGEN=await balance(reader,d.contractAddress);
  const toBase=x=>{const[w,f='']=x.split('.');return BigInt(w)*10n**18n+BigInt(f.padEnd(18,'0'));};
  if(toBase(step.afterContractGEN)-toBase(step.beforeContractGEN)!==10n**18n)throw Error('Exact1GEN deposit balance proof missing');
  step.depositVerified=true;save(record.file,record);
 }
 console.log(JSON.stringify({step:key,status:proof.status,executionResult:proof.executionResult}));return raw;
}
export async function withdrawal(reader,d,record,key,account,leaseId){
 let step=record.steps[key];
 if(!step){const credit=await view(reader,d.contractAddress,'get_credit',[leaseId]);if(credit.credit_gen!=='1'||credit.owner!==account.address.toLowerCase())throw Error('Exact own credit required');step={beforeContractGEN:await balance(reader,d.contractAddress),beforeRecipientGEN:await balance(reader,account.address)};
  record.steps[key]=step;save(record.file,record);
  // write creates and identity-binds the actual operation fields before signing.
  Object.assign(step,{method:'withdraw',args:[leaseId],sender:account.address,valueGEN:'0'});save(record.file,record);
 }
 const raw=await write(reader,d,record,key,account,'withdraw',[leaseId]);
 if(!step.nativeProof){
  const children=raw.triggered_transactions??raw.triggeredTransactions??raw.children??[];
  const hashes=children.map(x=>typeof x==='string'?x:x.hash??x.transaction_hash??x.transactionHash);
  if(hashes.length!==1)throw Error('One native child required');
  const hash=hashes[0];let child;
  for(let count=0;count<100;count++){child=await safe(()=>reader.request({method:'eth_getTransactionByHash',params:[hash]}));if(child?.status==='FINALIZED'||child?.status===7)break;await new Promise(resolve=>setTimeout(resolve,4000));}
  step.nativeProof=nativeChild(child,hash,{sender:d.contractAddress,recipient:account.address,valueGEN:'1',parentHash:step.transactionHash});
  step.afterContractGEN=await balance(reader,d.contractAddress);step.afterRecipientGEN=await balance(reader,account.address);
  // Native integer comparison avoids floating point; amounts are presented only in GEN.
  const toBase=x=>{const[w,f='']=x.split('.');return BigInt(w)*10n**18n+BigInt(f.padEnd(18,'0'));};
  if(toBase(step.beforeContractGEN)-toBase(step.afterContractGEN)!==10n**18n||toBase(step.afterRecipientGEN)-toBase(step.beforeRecipientGEN)!==10n**18n)throw Error('Native/recipient exact1GEN delta not proven');
  save(record.file,record);
 }return step;
}
export function fail(e){console.log(JSON.stringify({failed:true,errorType:e?.name??'OperationError',rpcErrorCode:Number.isInteger(e?.code)?e.code:null,detail:'Inspect safe persisted operation state; no automatic replay.'}));process.exitCode=1;}
