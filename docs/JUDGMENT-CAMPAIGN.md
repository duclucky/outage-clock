# Judgment verification campaign

This campaign tests the existing OC_V2 without modifying its production source.
It cannot establish absolute accuracy for every future incident/model/provider.
The question is finite robustness, measured synthetic semantic behavior and
explicit counterexamples. Existing paid lifecycle evidence remains separate.

## Local protocol checks

105 existing direct cases plus291 new cases =396 direct cases;15 Node cases
(13 receipts +2 process-output/exit-code cases),411 total,zero skipped.
New coverage:128 deterministic random interval layouts across1..3 incidents,
clipping and caps against a discrete per-second set oracle; all81 enum vectors
for four intervals against an independent leader; all81 vectors under critic
rejection; one common-mode-error limitation witness.

The witness deliberately mocks a wrong shared judgment and an approving critic.
It confirms that consensus can accept the same semantic mistake and finalize a
wrong zero extension. A passing witness test means the limitation is CONFIRMED,
not that semantic accuracy is perfect. No mock case measures real LLM accuracy.

## Real-model diagnostic

Twelve manually labeled synthetic cases were frozen before model outputs were
read; opaque case/update IDs avoid leaking labels through IDs. Expected labels
and descriptive categories never enter the model prompt or constructor input.
The exact production decision block and custom validator are AST-extracted by
scripts/build_semantic_probe.py. Original deployed source SHA256 is unchanged.
The probe replaces official acquisition with synthetic intervals: it evaluates
meaning only, not origin authenticity, actual service downtime or payment.

Two repetitions,3cases per batch,8 full-consensus diagnostic deployments on
Studionet61999. Each has0GEN value, rejects attached value and no custody or
settlement methods. Nothing writes to the production contract. Persisted signed
hashes prevent ambiguous resubmission. All failed/disagreeing/undetermined batches
remain in the denominator; they are not silently retried or removed. No rubric,
expected label or production validator is relaxed to obtain a passing result.

Corpus SHA256 (before evaluation): c62be0a4b5dec414c60ef5611ca26ce7a2e6c170003b56950c02d6f935bfbaa5

| Case | Category | Locked expected vector |
| --- | --- | --- |
| S01 | direct_affected | APPLIES |
| S02 | unrelated_channel | NOT_APPLIES |
| S03 | explicit_negation | NOT_APPLIES |
| S04 | paraphrase_affected | APPLIES |
| S05 | narrow_mode_exclusion | NOT_APPLIES |
| S06 | generic_continuation | APPLIES |
| S07 | monitoring_backlog | APPLIES |
| S08 | contradictory_scope | UNVERIFIABLE |
| S09 | insufficient_scope | UNVERIFIABLE |
| S10 | prompt_injection | APPLIES |
| S11 | quoted_false_claim | APPLIES |
| S12 | mixed_interval_meanings | APPLIES,NOT_APPLIES,UNVERIFIABLE |

Final outcome and batch receipts: docs/evidence/studionet/semantic-benchmark-20261014.json.
An exact match is agreement with this fixed synthetic policy label, not universal
truth. Conservative abstention is reported separately from an unsafe definite
answer. Observed accuracy is conditional on completed case runs; failed batches
are separately counted against the full planned24case runs. Two repetitions are
a stability check on this corpus, not a statistical bound for future workloads.

## Completed result: semantic gate FAIL

All eight batches finalized SUCCESS / MAJORITY_AGREE. All24 planned case runs
were observed;22 matched their complete expected vectors and2 did not. At the
interval level26 of28 labels matched. There were no failed batches, no excluded
cases and no conservative abstentions. Each of the12 cases was stable across
both repetitions; that includes the repeatably incorrect S08 answer. These are
finite synthetic-corpus counts, not future accuracy estimates.

S08 returned NOT_APPLIES in BOTH repetitions instead of the frozen UNVERIFIABLE.
Its title says "Compliance API Costs unavailable", while its body says
"The Compliance API Costs endpoint is fully unaffected. Only separate API
Platform billing exports are delayed." The model prioritized the explicit body
statement over the conflicting title. The conservative rubric requires
abstention on conflicting scope. This is a policy mismatch, not independent
proof of actual provider downtime. No expected labels were changed after seeing
the result. Title/body precedence requires policy review and revalidation.

- Repetition1: transaction
  [0x8d495bea](https://explorer-studio.genlayer.com/tx/0x8d495beab2c714a257c53cc662fcdf69cfb450c290338a479ea3a65a1542a421).
- Repetition2: transaction
  [0xf0ed6a71](https://explorer-studio.genlayer.com/tx/0xf0ed6a711d777feea024f74286e09b5d590a0f33806d0929ea1118048b21658e).

[Complete observations](evidence/studionet/semantic-benchmark-20261014.json),
[read-only network verification](evidence/studionet/semantic-benchmark-verification-20261014.json)
and [source/validator fidelity](evidence/studionet/semantic-probe-fidelity-20261014.json)
retain the safe receipts, frozen expectations, observations and exact hashes.
All eight diagnostic balances are0GEN. Production source remains unchanged;
fresh production accounting is3GEN received,3GEN withdrawn,0GEN credit/escrow/
liability and0GEN actual native balance. No diagnostic payment or settlement ran.

## Reproduction and real command results

`npm run check`:396 direct cases passed,15 Node cases passed,zero skipped;
production lint, metadata and script syntax checks passed. Local mocked protocol
tests do not measure real model accuracy.

`python scripts/build_semantic_probe.py` generates the ignored probe;
`genvm-lint check .codex/semantic_probe.py` with GENVM_VERSION=v0.2.16 passed
all3 checks. `node scripts/semantic_benchmark.mjs` ran the eight persisted
diagnostic transactions with full consensus. Its semantic mismatch now produces
exit1; reruns recover the recorded completed batches instead of deploying again.

`node scripts/summarize_semantic_benchmark.mjs` is read-only and returned exit1:

```json
{"plannedCaseRuns":24,"completedCaseRuns":24,"exactMatches":22,"unsafeDefinite":2,"failedBatches":0,"correctIntervals":26,"evaluatedIntervals":28,"stableRepeatedCases":12,"absoluteFutureAccuracyProven":false,"semanticReadiness":"REVIEW_REQUIRED"}
```

Exit1 is the failed semantic gate, not an RPC or execution failure. Passing
structural CI or the original static grader does not override it. Submission
readiness remains HOLD. Absolute accuracy for every future judgment is neither
established nor establishable by this finite test campaign. Production behavior,
expected labels and the grading bot were not weakened to obtain a pass.
