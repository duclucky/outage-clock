// Initial deployment evidence is immutable; a resumed case may already hold GEN.
export function requireLifecycleIdentity(deployment,version,sourceHash){
 if(!deployment?.active||deployment.status!=='FINALIZED'||deployment.executionResult!=='SUCCESS'||
    !['MAJORITY_AGREE','AGREE'].includes(deployment.consensusResult)||deployment.version!==version||
    deployment.sourceSHA256!==sourceHash||deployment.canonicalAccounting?.received_gen!=='0'||
    deployment.schema?.acceptPayable!==true){
  const error=Error('Exact current-source deployment smoke required before signer use');
  error.name='LifecycleIdentityError';throw error;
 }
}
