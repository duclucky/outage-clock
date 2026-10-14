# Approved scope-conflict remediation

Owner approved the proposed semantic-policy correction and revalidation in chat
on2026-10-14. This is a revision of IDEA-043, not a new idea/category. All14
admission rows, NO-APP, MEANING-VALIDATOR, SAFETY-ROW, temporal and value matrices
remain applicable. OC_V2's failed benchmark remains immutable historical evidence.
This plan does not claim absolute accuracy or current submission readiness.

## Cause and approved policy

S08 returned NOT_APPLIES twice despite a title asserting the exact channel was
unavailable and a body denying any impairment. A single boolean critic did not
surface that conflict. The conservative conflict rule must be explicit in both
prompts and enforced over structured semantic assessments by deterministic code.

The independent second assessment reads the original source and locked channel,
without seeing the first answer. For every exact interval ID it reports title
and body meaning separately (APPLIES/NOT_APPLIES/UNVERIFIABLE), whether the body
is only a generic continuation, whether it explicitly reports current recovery,
and whether unresolved contradictory assertions exist. It also reports a strict
boolean consistency result. These remain model judgments, not authenticated facts.

Rules, fixed before the new real-model runs:

1. Opposing definite title/body meanings or an unresolved-conflict flag force
   UNVERIFIABLE. A bare assertion of being unaffected cannot erase a conflicting
   impairment title.
2. An explicit current recovery transition may supersede a historical impairment
   title. A general/broad incident title does not assert every narrower channel.
3. Generic continuation inherits the title scope; it must not invent explicit
   body scope. Otherwise the body assessment controls when no conflict exists.
4. First answer and independent derived answer must agree; disagreement forces
   UNVERIFIABLE. Missing/extra IDs, invalid enums, non-boolean flags, duplicate
   JSON keys or inconsistent generic/recovery fields fail closed.
5. Any UNVERIFIABLE keeps the lease RETRYABLE, unverified and unextended. It
   grants no exercise right or credit. Original hard-cutoff recovery remains.

## Affected write safety row (before implementation)

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| review_clock | Named issuer/buyer | REVIEWABLE/RETRYABLE, attempts<3 | All others, verified | now<hard_cutoff; equality late | Append bounded attempt; READY once | Conflict/malformed audit stays retryable; escrow retained, no credit or transfer | lease/clock/attempt/accounting | S08 both conflict directions; malformed/missing/replayed IDs; old boolean-only approval; invalid flags; unsupported recovery; independent dissent; exercise blocked; unchanged GEN ledger |

All eight public writes, fourteen methods, source authentication, actual1GEN
payment paths, timestamp guards and recipient boundaries otherwise stay intact.
Version advances to OC_V3; no migration of existing leases or reinterpretation
of deployed OC_V2 state is permitted.

## Execution checkpoints

1. RED: reproduce ignored structured conflict using the actual review entrypoint
   and old source. Keep the original frozen twelve scenarios and expectations.
2. Implement strict audit normalization and conflict derivation; verify focused
   regressions, semantic lint, then the entire npm run check suite.
3. Freeze separate holdout cases before model calls; AST-extract the new exact
   semantic block and validator into a no-custody diagnostic. Two repetitions of
   baseline plus holdouts on owner-selected Studionet, no expected-label leakage.
   Retain every result/failure without cherry-picking. Any mismatch leaves HOLD.
4. Only after semantic gate passes: archive OC_V2 with fresh zero-balance/liability
   proof, deploy OC_V3 using the authorized account and matched pinned runner,
   verify schema/source/smoke. Prove the revised paid lifecycle and recovery with
   receipts and exact native balance changes before claiming execution readiness.
5. Re-run original unmodified grader, public hygiene, publish versioned evidence,
   verify CI, update claims and final checklist. Portal submission stays manual.

Local passes, finite synthetic accuracy, production source acquisition, paid
consequence and adoption are separate claims. If a required check fails, retain
HOLD and report the failure. Never modify labels or the grader to obtain a pass.

## Verified local checkpoint

`gltest tests/direct/test_scope_conflicts.py -q --tb=short` on the old source:
2 failed, both `READY != RETRYABLE`, for APPLIES/NOT_APPLIES and the reverse.
After implementation:2 passed. `genvm-lint check contracts/outage_clock.py`:
3 checks passed, validation passed, OutageClock,14methods (6view/8write).
`npm run check`:421 direct cases passed,15 Node cases passed,zero skipped
(436 total). This includes25 new strict-audit/conflict regressions. Existing
common-mode-error witness remains a passing limitation characterization.

OC_V3 source SHA256:
7bb5bb22c14ecd54c810836bb918f85c8805b6ec5f38804fd5e7f26abcdb5d45.
Probe SHA256:cd0b689d57b65fe72eb8067f07f5619f884f38367dcd4b4ce1d66d39842f3dbc.
Probe semantic lint passed, one view and zero writes, no custody/value.
Frozen eighteen-case corpus SHA256 (JSON.stringify representation):
0a57f089b41cdc37c281834be7664f6bddabbfe793a5775967c726f8162e3a0e.
The twelve original scenarios/expected vectors are unchanged; six additional
cases cover reverse and paraphrased contradictions, broad-title refinement,
explicit current recovery, unrelated continuation and unresolved body conflict.
No new model output had been observed when this checkpoint was committed.

Real-model execution command: `node scripts/semantic_benchmark.mjs OC_V3`.
Read-only independent recheck: `node scripts/summarize_semantic_benchmark.mjs OC_V3`.
Status: local verification complete; new model and paid lifecycle evidence pending.

Public candidate CI also passed436 cases (421 direct +15 Node),zero skipped:
https://github.com/duclucky/outage-clock/actions/runs/38555109749
Candidate source commit:50a713c20fe95f5e40a79b1592535d08c3e2bab2.
