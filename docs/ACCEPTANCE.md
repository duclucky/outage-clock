# Historical structural acceptance - semantic acceptance now on HOLD

Follow-up: the real-model S08 benchmark disagrees with the locked conservative
policy despite full consensus. Static0BLOCKER does not establish semantic accuracy
or override this finding. Submission readiness is suspended; see JUDGMENT-CAMPAIGN.md.
OC_V4 revalidation ended35/36 exact with one unsafe S02 false positive. Both
`node scripts/studionet.mjs` and `node scripts/archive_v2.mjs` returned exit1;
the active OC_V2 deployment file remained unchanged. No new production revision
or paid lifecycle ran. See evidence/studionet/promotion-block-v4-20261014.json.

The original workspace grader was executed with PowerShell7, the pinned project
venv first on PATH, PYTHONUTF8=1 and GENVM_VERSION=v0.2.16. No check was skipped.
Its three code-file hashes stayed unchanged. The command used this repository,
Category intelligent-contracts, the public GitHub URL, the actual active Explorer
address URL, and docs/submission-description.txt (860 characters).

```text
Summary: 0 BLOCKER, 1 WARN, 7 auto-verified OK
npm run check: PASS
gltest: PASS
[PASS] real GenLayer contract present
[PASS] uses consensus
[PASS] not a renamed boilerplate / empty fork
[PASS] repository builds & tests pass
[OK] submission notes <= 1000 chars (is 860)
VERDICT: GATE OK
```

Exit code1 is preserved because the static scanner reports private _no_value
reading message.value without payable decoration. This helper rejects value on
nonpayable entrypoints. Only public accept receives1GEN: AST and the exact deployed
schema both prove its payable metadata. Making the helper payable or altering the
grader would be wrong. The warning remains visible and reviewed.

Local and CI count105 direct cases +13 receipt cases +2 stream/exit-status cases,
zero skipped. [Successful CI](https://github.com/duclucky/outage-clock/actions/runs/38510219155).
Full-suite lint, metadata and script checks are included. This is an estimate and
readiness check; it is not an official score, Portal acceptance or adoption proof.

[Live verification](evidence/studionet/verification.json):4 CLOSED cases,20 successful
finalized parent writes,3 exact1GEN native transfers,3GEN received and withdrawn,
zero contract native balance and liability; exercise was after nominal expiry.
[Archived V1 recovery](evidence/studionet/archive/v1/recovery-flagged-v1.json) has a
separate refunded1GEN,zero liability and no exercise. It is not counted as a V2 case.
