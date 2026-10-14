# OutageClock

> SEMANTIC REVIEW REQUIRED (2026-10-14): the expanded real-model synthetic
> OC_V4 fixed S08 on the frozen corpus but failed S02 in its second repetition:
> a Codex-only incident was incorrectly applied to the locked Costs channel.
> Result:35/36 exact,1 unsafe definite mismatch despite MAJORITY_AGREE.
> Promotion and new payments are blocked; OC_V2 payment evidence is historical.
> OC_V5 subsequently produced conservative mismatches and dissenting batches.
> OC_V6 failed the authentic-source smoke: its final monitoring interval was
> UNVERIFIABLE. OC_V7 distinguishes progress notes from explicit health/scope
> uncertainty. Its authentic-source smoke finalized MAJORITY_DISAGREE (FAIL);
> its partial64-run campaign also exposed an S03 conservative mismatch.
> OC_V8 corrects target exclusions/title-only coverage; real-source/72-run gates
> are pending. No candidate production promotion or new payments.
> See docs/CONTEXT-REMEDIATION.md and docs/JUDGMENT-CAMPAIGN.md.

Reusable GenLayer Intelligent Contract for a paid, one-use protocol entitlement
whose exercise deadline can be extended by agreed official disruption intervals.
Validators independently fetch the official OpenAI incident feed and interpret
each interval against the exact ratified service channel. Contract code clips,
unions and caps the reported lost seconds, so overlapping reports never multiply
time. A buyer's valid exercise credits the fixed issuer1GEN; due expiry or unresolved
hard recovery refunds the actual buyer1GEN. Only own-wallet credits are withdrawable.

Category: Intelligent Contracts. Owner-selected Studionet61999. No app/frontend.
One ASCII `OutageClock`,8writes/6views; pinned matched v0.2.16 runner and SDK1.1.8.
V2 deployment and all four real lifecycle cases are complete. Local tests and
actual network receipts are separate evidence. [Public repository](https://github.com/duclucky/outage-clock) and a
[successful CI run](https://github.com/duclucky/outage-clock/actions/runs/38510219155)
verified the earlier120-case baseline. Expanded411-case
[CI also passed](https://github.com/duclucky/outage-clock/actions/runs/38552106717).

## Validate

The working tree contains the OC_V8 target/title-boundary candidate. Its separate
service relations/statuses, source-span checks and deterministic input bindings are
specified in [the remediation plan](docs/TARGET-REMEDIATION.md). OC_V3 failed real-model
revalidation and was never promoted or funded. OC_V2 remains the deployed
historical revision. OC_V4 failed the semantic gate and was not promoted or funded.

Python3.12: create `.venv`, install `requirements-dev.txt`, then `npm ci` and
`npm run check`. The OC_V8 local run passed458 Python direct cases and53 Node cases
(511 total), semantic lint and AST metadata,
zero skipped. Real-model and production lifecycle acceptance remain separate.

[Specification](docs/README.md) locks authority, safety, value destinations,
temporal gates, claim-to-code and honest limits before implementation.

## Reuse and limitations

LangGraph retry brokers, A2A timed-entitlement gateways and DAOhaus mandate
adapters can consume finalized lease/clock/attempt/credit views and signed
exercise/recovery operations. These are proposed consumers, not adopters.
Rights exist only inside this protocol; no actual service execution, external
property, legal title or measured customer downtime is proven. Exact selected
incidents and retrospective reference window are explicitly agreed before payment.
The reported timestamp proxy is contractual; source disappearance leads to
retry or eventual payer recovery. Maximum3 incidents,16updates each,3attempts.


## Deployment and real worked example

NETWORK = Studionet (chain ID 61999), OC_V2. Result: SUCCESS; Status: FINALIZED.
CONTRACT_ADDRESS = `0x3782b660116bd8cBFfFB871fEAbC8FC18c225d3b`.
[Explorer address](https://explorer-studio.genlayer.com/address/0x3782b660116bd8cBFfFB871fEAbC8FC18c225d3b)
and [deploy transaction](https://explorer-studio.genlayer.com/tx/0xf383a5df4f7c2791e6dad4e0110dfc5e3a515f8c31ef2e3e61d3417e0e66c05f).
Deployed bytes match source SHA256 d3a5d349781fff0d787f9716a7291142e954772bdac32227e80f2b537e0d5a31
at implementation commit fc611f0343b46bd5aac7eb755b61342db2735046.

Real result, not an expected fixture: issuer offered the agreed GPT-6.1 Sol
Codex/Work channel against official incident 01M4T4ZCM54D3ZPTQXRSWFG0XS and
its Oct13 reporting window. Buyer accepted the exact digest with 1 GEN.
Independent semantic review classified all four intervals APPLIES: 30,402 reported
seconds, capped at 300 seconds. Base deadline 2026-10-14 03:41:37 UTC became
03:46:37 UTC. Buyer exercise transaction time was 03:41:42 UTC, after the base deadline
and before effective expiry; it subsequently finalized with Result: SUCCESS. Issuer withdrew exactly 1 GEN;
its bound native child finalized, contract decreased 1 GEN, recipient increased
1 GEN. Lease CLOSED, contract native balance and liability both 0 GEN.
[Canonical case/receipt/balance proof](docs/evidence/studionet/lifecycle-affected.json).

V1 is superseded and recovered: its Costs classification contradicted its own
rationale, so no exercise was allowed. Buyer received the full 1 GEN refund and
native balance/liability closed at zero. [Archived recovery](docs/evidence/studionet/archive/v1/recovery-flagged-v1.json).
V2 adds a separate semantic consistency review; the S08 benchmark shows that the critic can miss a scope contradiction. Every validator still
independently fetches and interprets the source and must agree on the complete
interval meanings and bound facts, rather than rationale strings or JSON shape.


## Full lifecycle verification

`node scripts/verify.mjs` independently re-read all four CLOSED leases, exact
source/schema, 20 successful finalized parent writes, three bound native transfers,
and authoritative exercise/recovery/cancellation timestamps. Affected: 300-second
extension and exercise after nominal expiry, issuer paid 1 GEN. Unrelated channel:
zero extension and due buyer refund. No-review paid lease: buyer recovery at hard
cutoff. Unpaid offer: due cancellation and zero close. Each paid case accepts
1 GEN; final accounting is 3 GEN received, 3 GEN withdrawn, 0 GEN escrow/credits
and 0 GEN actual native balance. [Independent verification](docs/evidence/studionet/verification.json).
[Integration steps](docs/INTEGRATION.md), [review](docs/REVIEW.md) and
[network selection](docs/evidence/studionet/network-selection.json) explain the
boundaries and versioned Studionet compatibility. `node scripts/recover_flagged.mjs`
is now read-only and re-verifies the recovered historical V1; it cannot operate
against the active V2 or send another transaction.


[Portal fields](docs/SUBMISSION.md) contain the860-character English description,
repo/explorer/CI links and actual lifecycle summary. [Acceptance](docs/ACCEPTANCE.md):
original grader0BLOCKER,1 reviewed helper WARN; npmcheck/gltest and all four grade
gates PASS. This is historical structural evidence; the current semantic HOLD
supersedes submission readiness. It is not Portal acceptance or an official score.


## Expanded judgment campaign

[Campaign protocol](docs/JUDGMENT-CAMPAIGN.md) separates411 local protocol cases
from real-model synthetic GenVM evaluation. The deployed OC_V2 source remains
unchanged. A dedicated common-mode-error witness confirms that passing consensus
cannot guarantee semantic truth when all interpreters/critics share a mistake.
Historical OC_V2 observed24 of24 case runs:22 matched and S08 failed twice.
OC_V3 matched29/36 planned runs with4 conservative abstentions and3 unobserved
runs due to one dissenting batch. OC_V4 observed36/36 and matched35, with an
unsafe definite S02 mismatch in repetition2. S08 matched in both OC_V4 runs.
OC_V7 has9observed/8exact of64planned,including the S03 abstention, and failed
its real-source consensus. OC_V8 corrects title-only coverage/target exclusions;
the first3 cases matched,including S03. Full72runs and real-source PASS are pending.
Readiness remains HOLD; no universal accuracy claim is made. [Published V7 CI](https://github.com/duclucky/outage-clock/actions/runs/38610987350)
passed510 protocol checks. The working V8 has511 local checks; that is separate
from published CI, authentic-source consensus and a new paid lifecycle.
