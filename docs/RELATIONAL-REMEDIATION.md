# OC_V5 relational scope correction, before implementation

The instrumented OC_V4 control S02T0 finalized SUCCESS / MAJORITY_AGREE with
the wrong APPLIES answer despite exact prompt arguments matching the frozen
Costs target. Codex was impaired, Costs was the locked operation. S02T2 also
abstained for an unrelated audio target. This rules out lost target bytes for
these observations. The internal provider/model cause remains unknown.

The current schema overloads APPLIES: the title enum describes impairment of
the title's own service, while the body enum describes applicability to the
locked operation. Both prompts have the same structure. The correction will
separate relation from status symmetrically and make each model acknowledge
the exact target. This is a mitigation for the observed interpretation failure,
not a guarantee against common-mode semantic error.

Each assessment must echo channel exactly and report, per interval, both
title_scope and body_scope (EXACT/BROAD/UNRELATED/UNSPECIFIED). Both status enums
describe the named subject's impairment. For an explicitly named target in a
multi-service body, report its status, not another impaired service's status.
Each non-generic body assessment must cite a nonempty exact source span, at
most300characters. A generic continuation uses UNSPECIFIED/UNVERIFIABLE and no
span. Source-span membership proves provenance only; relations/paraphrases are
still judged by independent models, never keyword equality.

Code maps an unrelated body to NOT_APPLIES, insufficient/broad scope to
UNVERIFIABLE, and exact scope to its status. Generic continuation, exact-title
conflict, broad-title refinement, explicit recovery and body contradiction keep
the already-approved policy. Two independent semantic vectors must agree.
The second prompt asks for the counterexample to relation before status;
neither pass sees the other answer. Canonical target/evidence are JSON data.

The existing review_clock safety row in SCOPE-REMEDIATION.md applies. Forged
target echoes, non-source quotes, incomplete/invalid relations, malformed
generic/recovery and post-consensus component tampering must not grant a clock
or move/credit GEN. Deterministic source/prompt/channel binding is also checked
before mutation. All temporal, authorization,1GEN destination and withdrawal
boundaries remain unchanged. No frontend, additional contract or taxonomy.

Keep all18 frozen scenarios and their original expectations unchanged. Add the
six prelocked target controls from PROMPT-BINDING-DIAGNOSIS.md as separate
regressions before running OC_V5. Two repetitions,24cases,48planned observations.
No failed/missing observation can be omitted, and any mismatch blocks promotion.
Only a complete passing campaign plus fresh read-only verification permits
archiving zero-liability V2, exact-source replacement and the new paid lifecycle.

## Local evidence before the48-run campaign

The complete instrumented V4 controls finalized both batches with SUCCESS /
MAJORITY_AGREE:4/6 exact,1 unsafe false positive,1 conservative abstention.
All six captured prompt argument pairs matched the original prompt function,
target and evidence; both diagnostic balances were0GEN. The evidence is retained
in evidence/studionet/prompt-binding-diagnosis-20261014.json.

RED binding tests:2 failed (forged fields were ignored). GREEN:2 passed after
input bindings. RED relational tests:6 failed/4 passed before the new protocol.
GREEN focused suite:46 passed. Additional four post-consensus tampering tests
verify unchanged state/GEN. `npm run check`:446 Python +15 Node =461 passed,
zero skips. Semantic lint:3checks and validation passed, OutageClock14methods.
The diagnostic passed semantic lint, one view and zero writes.

Candidate sourceSHA256:28d6bf16c50687b796cea8b735097b4efa45d8474d40cfe1cfe203db8d5e9f4f.
DiagnosticSHA256:43844136e7ee753729788acc532d483b86ae7809a94ebc849d6a59953177b890.
`node scripts/semantic_benchmark.mjs OC_V5` must observe all48 planned outcomes.
No OC_V5 model result had been observed at this checkpoint. The network and
paid lifecycle gates remain independently binding; local tests do not clear them.

Final local checkpoint: `npm run check`447 Python +25 Node =472 passed,zero skips.
Additional evidence proves different valid source spans with the same semantic
vector remain equivalent. Ten promotion-guard tests accept complete bound48-run
evidence and reject missing/mismatched cases, dishonest aggregates, stale identity,
failed consensus, source mismatch and nonzero diagnostic balances. The original
workspace grading bot is unchanged. V5 campaign remains pending at this checkpoint.

Final tooling checkpoint: `npm run check`447 Python +28 Node =475 passed,zero
skips. The pinned SDK1.1.8 transport calls fetch without an abort signal. A polling
request stopped updating while an independent read still answered. The bounded
read-only poller now aborts after20seconds, strips error payloads to a safe code,
and cannot submit transactions. Three targeted transport regressions passed. The
stalled process was stopped after its original hash was persisted; the campaign
resumed that exact hash, without signing/broadcasting a replacement. No semantic
outcome was discarded or retried. This transport mitigation does not diagnose
the external connection stall or assert a hosted service outage.
