// SDK1.1.8 has no fetch timeout option. Apply a deadline to its known RPC URL.
export function deadlineFetch(fetcher,rpcURL,timeoutMS=20000){
 return (input,options={})=>{
  const url=typeof input==='string'?input:input?.url;
  if(url!==rpcURL)return fetcher(input,options);
  const deadline=AbortSignal.timeout(timeoutMS);
  const signal=options.signal?AbortSignal.any([options.signal,deadline]):deadline;
  return fetcher(input,{...options,signal});
 };
}
