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

Status: evaluation in progress; no accuracy percentage or completion claim yet.

First confirmed finding: S08 returned NOT_APPLIES instead of the prelocked
UNVERIFIABLE. See semantic-S08-first.json. Semantic readiness is suspended;
remaining batches/repetitions continue unchanged.
