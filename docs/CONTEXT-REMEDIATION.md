# Context-note classification correction, before code

The authentic-feed OC_V6 smoke finalized SUCCESS / MAJORITY_AGREE but failed its
prelocked gate. Three affected intervals were APPLIES and the final monitoring
interval was UNVERIFIABLE. All four Costs intervals were NOT_APPLIES. No GEN
was deposited; source bytes matched and diagnostic balance was0GEN.

Both affected assessments correctly identified the covered impairment title but
returned body_scope=UNSPECIFIED/body=UNVERIFIABLE/generic=false for the same
provider progress note. Exact span and complete proof are in
evidence/studionet/live-source-last-interval-v6-20261014.json. This is not a
source outage, injected payout instruction or failed source authentication.

The approved policy already inherits a covered title for a generic continuation.
The boolean generic interface did not reliably distinguish an action/progress
note from an explicit health assertion or withdrawal of service identification.
OC_V7 will ask for body_kind first:

- CONTEXT_NOTE: investigation/diagnosis/mitigation/monitoring/recovery-observation
  progress in the active incident, without an explicit current health assertion
  or withdrawal of service identity. It uses UNSPECIFIED/UNVERIFIABLE body fields
  and inherits title meaning through contract code. Mentioning recovery alone
  does not assert completed recovery. This remains a reported-time proxy.
- STATUS_ASSERTION: a current health assertion, explicit unknown target status,
  or explicit completed recovery. Existing coverage/conflict/recovery rules apply.
- SCOPE_WITHDRAWAL: explicit uncertainty/retraction about which service/operation
  is affected. It always forces UNVERIFIABLE, even with a covered title.

Require a nonempty exact body span for every kind, including context notes;
remove the misleading empty-quote requirement. Keep two independent semantic
evaluations, typed output, complete IDs, target/prompt/source bindings, direct
coverage requirements and non-penalizing dissent. Do not recognize a particular
sentence through keyword/string matching. All current expected labels stay fixed.
The actual source failure remains immutable; it cannot be relabeled PASS.

The review_clock safety row remains: named parties, REVIEWABLE/RETRYABLE only,
attempts<3 and now<hard_cutoff; no credit/GEN transfer from uncertainty; canonical
lease/clock/attempt/accounting views; wrong caller/state/expiry/duplicate, forged
kind/quote, explicit scope withdrawal and unchanged state/accounting negatives.
Eight writes/six views,1GEN value destinations, source authority and temporal
guards are unchanged. No new public method, app, recipient or runner/API upgrade.

Freeze four additional context controls before OC_V7 model calls, preserving all
28 OC_V6 cases. The complete campaign is32cases/two repetitions,64planned runs.
Keep OC_V6's source/probe and every pending/failed observation independently.
The real-model/authentic-source failures establish semantic RED; local mocked
tests verify protocol responses, not language-model accuracy. No production
promotion or new paid lifecycle until all64 and real-source smoke checks pass.

## Local verification before production promotion

`npm run check` exited0:458 Python cases passed in56.53seconds;52 Node cases
passed,zero skipped. Lint passed3checks and semantic validation recognized
OutageClock14methods(6view/8write). Source/metadata scan printed
ASCII_HEADER_CLASS_METADATA_TEMPORAL_NO_APP_OK. Eleven context-kind tests include
the source failure, scope withdrawal, explicit unknown health and malformed output
with unchanged GEN/state. Independent semantic replay remains in the full suite.

Deployment and archive now require BOTH the complete64-run semantic evidence
with independent re-verification and the exact-source authentic-feed smoke.
The latter rejects wrong network/revision/source/probe, pending/dissent,
nonzero balance/custody, unavailable/unverified evidence, missing affected time,
unrelated APPLIES and empty classes. This adds a project guard; the original
workspace grading bot and every frozen expected result remain unchanged.

ProductionSHA256:89eb5de91b8a49c2d04363ef833ccba404f0bb0555ac71f4d01c8e19ec938fe5.
SemanticProbeSHA256:539f2b376d084762fe7238bca3d9d52b838a5ee32bf8d52aa3ea1e22549d0994.
AuthenticSourceProbeSHA256:fc5fec0a689177cddaa4df30c2d69e8e587a2d6bc5985b608d7d8602c558fe3b.
These local results do not complete the real-model, production or payment gates.

## Authentic-source execution: FAIL, not promoted

`node scripts/source_smoke.mjs OC_V7` finalized the original saved transaction
0x31c54a3e7a6939f203e4cf0366173c83559999fe3fda65d34a9d42e9e260e91f
with execution SUCCESS but consensus MAJORITY_DISAGREE,exit1. It sent0GEN and
created no production lease. This is NOT a successful canonical judgment.
`node scripts/inspect_source_smoke.mjs OC_V7` independently re-read that hash
and bound the exact constructor scopes/incident IDs to selected rejected leader
outputs. The leader mapped BOTH the Codex channel and its explicitly unrelated
Costs channel to APPLIES. Its returned/acknowledged channel strings differed
correctly; the Costs coverage meaning was wrong. The monitoring progress note
was categorized CONTEXT_NOTE in that rejected candidate. This diagnostic does
not prove the validators' precise rejection reason or a canonical verdict.

Keep the failed source record and rejected projection. Do not redeploy/retry to
replace it with a favorable sample. The prelocked32case/two-repetition campaign
continues independently to bound the observed failure surface. Both source
and64-run semantic gates are still required, so production replacement, new
payments and submission remain blocked. The old OC_V2 remains unchanged.

The receipt parser now whitelists only MAJORITY_AGREE/AGREE for successful
finality. Two RED regressions proved it previously accepted NO_MAJORITY or
missing consensus with FINALIZED/SUCCESS; both pass after the fix. A fresh
historical-only re-verification using the original deployed source commit found
20 valid parent receipts,3 bound native1GEN exits,4 CLOSED leases,3GEN in/out
and0GEN native/liability. It explicitly does not prove the current candidate.
