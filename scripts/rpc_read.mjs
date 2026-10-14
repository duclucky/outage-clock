// Bounded read-only RPC. Never log response/error payloads or validator config.
const READ_METHODS=new Set(['eth_chainId','eth_getTransactionByHash','eth_getBalance']);
export async function rpcRead(url,method,params=[],{fetcher=fetch,timeoutMS=20000}={}){
 if(!READ_METHODS.has(method))throw Error('Only allowlisted read methods permitted');
 const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(timeoutMS)});
 if(!response.ok){const error=new Error('RPC HTTP read failed');error.code=response.status;throw error;}
 const data=await response.json();
 if(data.error){const error=new Error('RPC read rejected');error.code=Number.isInteger(data.error.code)?data.error.code:null;throw error;}
 if(!Object.hasOwn(data,'result'))throw Error('RPC read result absent');
 return data.result;
}
