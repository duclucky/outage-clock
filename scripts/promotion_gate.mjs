// Project acceptance guard. This does not modify the workspace grading bot.
export function requireSemanticGate(version,sourceHash,benchmark,verified){
 const plan={OC_V4:{runs:36,batches:12},OC_V5:{runs:48,batches:16}}[version];
 if(!plan)throw Error('Unsupported replacement semantic version');
 const s=benchmark?.summary;
 if(!benchmark?.complete||benchmark.revision!==version||benchmark.productionSHA256!==sourceHash||
    s?.plannedCaseRuns!==plan.runs||s.completedCaseRuns!==plan.runs||s.exactMatches!==plan.runs||
    s.unsafeDefinite!==0||s.conservativeAbstentions!==0||s.failedBatches!==0||s.unobservedDueToBatchFailure!==0)
  throw Error('Replacement semantic execution gate pending or failed');
 const rows=benchmark.batches?.flatMap(b=>b.results??[])??[];
 if(benchmark.batches?.length!==plan.batches||rows.length!==plan.runs||
    rows.some(row=>!row.exactMatch||row.unsafeDefinite||row.conservativeAbstention||
      !row.expected||!row.observed||Object.keys(row.expected).length!==Object.keys(row.observed).length||
      Object.keys(row.expected).some(id=>row.observed[id]!==row.expected[id])))
  throw Error('Replacement semantic case evidence incomplete or mismatched');
 if(verified?.semanticReadiness!=='FINITE_CORPUS_ONLY'||verified.revision!==version||
    verified.candidateSourceSHA256!==sourceHash||verified.corpusSHA256!==benchmark.corpusSHA256||
    verified.diagnosticSHA256!==benchmark.diagnosticSHA256||verified.summary?.exactMatches!==plan.runs||
    verified.batches?.length!==plan.batches||verified.batches.some(b=>b.status!=='FINALIZED'||
      b.executionResult!=='SUCCESS'||b.consensusResult!=='MAJORITY_AGREE'||!b.sourceMatches||b.nativeBalanceGEN!=='0'))
  throw Error('Independent semantic re-verification pending or failed');
 return plan;
}
