import fs from 'node:fs';import path from 'node:path';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import{keccak256}from'viem';
import{ROOT,RPC,EXPLORER,client,actors,identity,file,save,safe,wait,view,balance,fail}from'./network.mjs';
import {requireSemanticGate} from './promotion_gate.mjs';
try{
 const reader=client();await identity(reader);const source=fs.readFileSync(path.join(ROOT,'contracts/outage_clock.py'));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),sourceHash=sha(source);
 if(process.argv[2]==='preflight'){
  const accounts=actors();if(accounts[0].address.toLowerCase()===accounts[1].address.toLowerCase())throw Error('Role separation');
  console.log(JSON.stringify({network:'studionet',chainId:61999,rpc:RPC,roles:await Promise.all(accounts.map(async(a,i)=>({role:i?'buyer':'issuer',address:a.address,balanceGEN:await balance(reader,a.address)})))}));
 }else{
  const version=source.toString('ascii').match(/^VERSION = "(OC_V[2456])"$/m)?.[1];
  if(!version)throw Error('Unrecognized source policy version');
  if(version!=='OC_V2'){
   const suffix=`v${version.slice(-1)}-20261014.json`;
   requireSemanticGate(version,sourceHash,file('semantic-benchmark-'+suffix),file('semantic-benchmark-verification-'+suffix));
  }
  let d=file('deployment.json');
  if(d&&d.sourceSHA256!==sourceHash)throw Error('Existing source identity differs; explicit archive required');
  if(!d){
   const status=execFileSync('git',['status','--porcelain'],{cwd:ROOT,encoding:'utf8'});if(status.trim())throw Error('Clean source commit required');
   const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
   const schema=await safe(()=>reader.getContractSchemaForCode(source.toString('utf8')));
   if(Object.keys(schema.methods??{}).length!==14||schema.methods.accept.payable!==true)throw Error('Exact source schema failed');
   d={network:'studionet',chainId:61999,rpc:RPC,sourceCommit:commit,sourceSHA256:sourceHash,version,runner:'py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6',valueGEN:'0',status:'PREPARED'};save('deployment.json',d);
  }
  if(!d.transactionHash){
   const account=actors()[0];d.preSubmitNonce=String(await safe(()=>reader.getCurrentNonce({address:account.address})));save('deployment.json',d);
   const signer=client({...account,signTransaction:async(...args)=>{const serialized=await account.signTransaction(...args);d.transactionHash=keccak256(serialized);d.signedAt=new Date().toISOString();save('deployment.json',d);return serialized;}});
   await safe(()=>signer.deployContract({code:new Uint8Array(source),args:[]}));console.log(JSON.stringify({stage:'DEPLOY_SUBMITTED',transactionHash:d.transactionHash,valueGEN:'0'}));
  }
  const{proof}=await wait(reader,d.transactionHash);Object.assign(d,proof);
  const address=d.contractAddress;if(!/^0x[0-9a-f]{40}$/i.test(address??''))throw Error('Address absent');
  const deployed=await safe(()=>reader.getContractCode(address));if(sha(Buffer.from(deployed))!==sourceHash)throw Error('Deployed source mismatch');
  const schema=await safe(()=>reader.getContractSchema(address));if(!schema.ctor||Object.keys(schema.methods??{}).length!==14||schema.methods.accept.payable!==true)throw Error('Deployed schema failed');
  d.schema={methods:Object.keys(schema.methods).sort(),acceptPayable:true};d.canonicalPolicy=await view(reader,address,'get_policy');
  d.canonicalAccounting=await view(reader,address,'get_accounting');d.nativeBalanceGEN=await balance(reader,address);
  d.explorerAddressURL=EXPLORER+'/address/'+address;d.explorerDeployTxURL=EXPLORER+'/tx/'+d.transactionHash;d.active=true;d.verifiedAt=new Date().toISOString();save('deployment.json',d);
  console.log(JSON.stringify({stage:'DEPLOY_VERIFIED',status:d.status,executionResult:d.executionResult,address,sourceMatches:true,methods:14,acceptPayable:true,accounting:d.canonicalAccounting,explorerAddressURL:d.explorerAddressURL}));
 }
}catch(e){fail(e);}
