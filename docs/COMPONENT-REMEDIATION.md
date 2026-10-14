# Same-policy component derivation follow-up

The owner-approved correction covers exact-channel conflict, broad-title
refinement and explicit current recovery. OC_V3's first real-model repetition
matched16/18 cases. S08,reverse conflict and paraphrase conflict matched, but
S15/S16 abstained even though their prelocked labels are NOT_APPLIES. Both
rationales treated an allowed refinement/recovery as a generic contradiction.
No unsafe definite answer was observed in that first repetition. HOLD remains.

The remaining defect is that the first model still emits a single final enum.
Even when the second component assessment correctly identifies an exception,
the global first enum can force an unnecessary abstention. Extending prose in
that first prompt did not reliably apply the approved rules. No expected labels
or grading checks will be changed.

## OC_V4 implementation plan, before code

Both independent model passes will report component meanings, never a final
class. For each exact interval ID: title scope EXACT/BROAD/UNRELATED/UNSPECIFIED;
title meaning and body meaning; strict generic/recovery/body_conflict booleans.
EXACT includes unambiguous synonymous descriptions of the locked operation.
BROAD identifies only a parent service family without asserting that operation.
UNRELATED identifies another service; it does not deny an explicit current
body report about the locked channel. Body conflict means conflicting assertions
inside the body, not a model's global precedence preference.

Contract code derives each vector: generic continuation inherits exact title
meaning (or NOT_APPLIES for an unrelated incident); otherwise body meaning
controls. Opposing definite EXACT title/body claims force UNVERIFIABLE unless
an explicit current recovery resolves the historical impairment. A BROAD title
cannot create that exact-channel conflict. Any body_conflict forces abstention.
The two independently derived vectors must agree; dissent stays UNVERIFIABLE.

Keep the normalized assessments with the nondeterministic result so settlement
invariants recompute the final classes before mutation. A fabricated final enum
that contradicts the supplied components must fail even before independent
validator replay. Malformed first assessment reverts; malformed second assessment
can only produce non-penalizing UNVERIFIABLE. Model explanations are not policy.

The existing eight write safety rows, exact1GEN value destinations, temporal
guards and source authority stay unchanged. review_clock retains its approved
safety row from SCOPE-REMEDIATION.md. Version OC_V4 binds the new implementation;
old deployed leases are never reinterpreted. The frozen eighteen-case corpus
and all36 planned outcomes are unchanged. Preserve completed OC_V3 evidence and
all its mismatches before replacing the candidate source. Then run focused RED/
GREEN regressions, full local checks, lint and the complete two-repeat campaign.
Any remaining mismatch keeps HOLD and prevents replacement deployment/funding.

## Preserved OC_V3 result and regression RED

The complete planned36-run campaign finished with33 observed runs,29 exact
matches,4 conservative abstentions,zero unsafe definite mismatches and one
MAJORITY_DISAGREE batch (3 unobserved runs retained in the denominator).
S08 matched UNVERIFIABLE in both repetitions. Mismatches: S15 once, S16 twice,
S17 once. No OC_V3 production deployment or GEN deposit occurred.
See evidence/studionet/semantic-benchmark-v3-20261014.json.

`gltest tests/direct/test_scope_conflicts.py -q --tb=short -k code_derives`
on unchanged OC_V3 source:2 failed,25 deselected. Both approved refinement/
recovery cases remained unverified instead of READY despite component meanings
supporting NOT_APPLIES. This RED result precedes the OC_V4 production change.
An ignored prototype passed semantic lint and nine pure-normalizer observations;
these are neither full direct tests nor GenVM/network execution proof.

OC_V3 read-only re-verification returned exit1 and REVIEW_REQUIRED, confirming
all12 receipts, source/report/balance bindings for successful probes and zero
production GEN liability/native balance. The old production source is unchanged.
See evidence/studionet/semantic-benchmark-verification-v3-20261014.json.

## OC_V4 local checkpoint

After implementation, `genvm-lint check contracts/outage_clock.py` passed3
checks and validation (OutageClock,14methods). Focused scope tests:34 passed.
`npm run check`:430 direct +15 Node =445 passed,zero skipped; metadata and
all script syntax checks passed. The81 candidate-vector validator cases now
include internally matching fabricated assessments, so independent replay still
has to reject an opposite semantic vector. Four result-tampering regressions
prove settlement invariant rejection leaves state/accounting unchanged.

Source SHA256:4d28c51a67234ba32e5913bd11146ca8ee2c0a3dc7cf75ab8e044e40f1755a51.
Probe SHA256:59743db75ee39b4dd7bdb71db2a0453e5dae55d00a21980af60d925ef742064d.
The probe passed semantic lint (one view,zero writes), with exact AST-extracted
production semantic helpers and validator. Corpus hash remains
0a57f089b41cdc37c281834be7664f6bddabbfe793a5775967c726f8162e3a0e;
all original and additional expectations remain unchanged.

Next commands: `node scripts/semantic_benchmark.mjs OC_V4`, then read-only
`node scripts/summarize_semantic_benchmark.mjs OC_V4`. No new model output
had been observed at this local checkpoint. HOLD remains pending these checks,
exact-source production deployment and the new paid lifecycle verification.

Public OC_V4 candidate CI passed445 cases at commit276efa4:
https://github.com/duclucky/outage-clock/actions/runs/38576285523.
CI is structural evidence; the36-run semantic gate remains independently binding.
