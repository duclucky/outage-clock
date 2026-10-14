# OutageClock specification

## Identity

IDEA-043; OutageClock; outage-clock; Intelligent Contracts; BUILDING, admission spec committed before code.
Studionet61999 expressly selected by owner in this chat. Workspace D1 unchanged.
Public repo not yet created. No product source from an existing project is reused.
This specification completes the copied PROJECT-SPEC-TEMPLATE sections.

## One-sentence product hook

Restore a paid exercise opportunity's deadline only for independently interpreted
official disruption intervals, without double-counting overlapping reports.

## Trust problem

Issuer and buyer must not control which official narrative intervals count as
lost time for their exact channel. A database, EVM or one backend LLM can preserve
records and do arithmetic, but cannot neutrally decide that semantic relation.
One1GEN payment and a one-time internal exercise right are at stake.

## Fingerprint

1. Trust problem: neutral usable-time restoration before paid rights expire.
2. Actors/adversary: issuer favors early expiry; buyer favors overcounted time.
3. Evidence class + authenticity mechanism: authoritative HTTPS incident timeline;
   sender-authored exact lease, digest-bound buyer assent and actual1GEN value.
4. Consensus question: each source-authored interval APPLIES/NOT_APPLIES/UNVERIFIABLE.
5. State machine: OFFERED -> REVIEWABLE/RETRYABLE -> READY -> EXERCISED/REFUNDED ->
   CLOSED, plus unpaid CANCELLED; append-only attempts and exact own credits.
6. Direct consequence: deterministic clipped interval union/cap changes exercise/
   refund legality; exercise pays issuer1GEN, due recovery refunds actual buyer1GEN.
7. Reuse surface: signed lease/exercise/recovery plus canonical clock/interval/credit
   views for LangGraph brokers, A2A gateways and DAOhaus timed-mandate modules.

## Mandatory gate matrix

All14 PASS_ADMISSION are recorded in the root admission before product code.
The actual diagnostic is separate from product execution.

| Gate | Status | Independent proof |
| --- | --- | --- |
| Replacement | PASS_ADMISSION | Neutral scope/interval decision lost under a single backend |
| Judgment | PASS_ADMISSION | Meaning of service-mode impairment, not a status flag/string |
| Evidence availability | PASS_ADMISSION | Real GenVM feed200/34390bytes, four intervals/two differentiated scopes |
| Evidence authenticity | PASS_ADMISSION | Complete matrix below, provider authority and transaction origin/value |
| Equivalence | PASS_ADMISSION | Independent full vector plus source bindings, rationale excluded |
| Consequence | PASS_ADMISSION | Real clock-gated exercise/refund and native escrow1GEN |
| Adversarial | PASS_ADMISSION | Issuer early expiration versus buyer overstated disruptions |
| State model | PASS_ADMISSION | Keyed leases, immutable terms, clock guards, one allocation, recoverable value |
| Reuse | PASS_ADMISSION | Three named consumers with exact interfaces below |
| Contract count | PASS_ADMISSION | One clock/right/escrow owner; EVM recipient is not a second IC |
| Differentiation | PASS_ADMISSION | Temporal union/clock rather than incident-credit pool or causal cap |
| Claim-to-code | PASS_ADMISSION | Filled method/view/test/live-case matrix below |
| Full lifecycle | PASS_ADMISSION / PENDING_EXECUTION | Three exact paid acceptance cases specified |
| Scope honesty | PASS_ADMISSION | Reported interval proxy, internal rights, locked incident list; honest limits |

## Actors, roles and incentives

Issuer creates immutable terms and may review/recover/close or withdraw issuer
credit. Buyer must be distinct nonzero wallet; accepts exact terms with1GEN,
may review/exercise/recover/close and withdraw buyer credit. Either party can
progress review and due recovery; an absent issuer cannot strand buyer funds.
Validators independently fetch and judge. Proposed consumers use finalized state.

## Scope and non-goals

One-use protocol entitlement, one1GEN payer, at most3 locked resolved OpenAI
incidents with2..16 updates each, bounded3 attempts and extension30..86400seconds.
No external ownership, performed service, law, physical downtime measurement,
exhaustive provider history, forward ongoing-incident oracle or adoption claim.
Reference windows may be retrospective by explicit agreement. The right begins
on acceptance, not in the past. Other providers are a later milestone.

## Product/frontend blueprint

Human UI/IA/visibility/action/state-label/responsive/design subsections: N/A,
contract-only NO-APP, no frontend/Vercel/browser-workflow claim. Canonical views
and deployment/integration scripts are the reuse interface.

## State model

Lease ID1..48ASCII alnum/_/-. Incident IDs1..40ASCII alnum, unique sorted set1..3.
Scope1..1200ASCII. Attempt ID lease:T<n>; interval ID incident:update. TreeMap[str,
Lease] and TreeMap[str,Attempt] with decorated dataclasses; bigint money/time/counts.
Lease stores issuer,buyer,scope,ids,reference start/end,accept/base/cap/hard/effective
deadlines,digest,state,attemptcount,escrow,credit,credit_to,withdrawn,extension,
reported seconds,source digest,interval rows. Interval rows are typed stored records,
not raw source JSON; views return canonical JSON only. Global received/withdrawn/
escrow/credit totals preserve accounting. Explicit constructor, no map reassignment.

create -> OFFERED; accept -> REVIEWABLE; review failure -> RETRYABLE; verified
complete vector -> READY with fixed effective deadline. Buyer exercise -> EXERCISED
and issuer credit. Due unused/pending recovery -> REFUNDED and buyer credit. Unpaid
deadline -> CANCELLED. Terminal zero-liability -> CLOSED. No rights/credit mutation
before verified clock; no updates to locked terms or reroll after READY.

Canonical time is timezone-aware runtime message datetime, no invented fallback.
Creation now+120<=base<=now+86400, now+30<=accept<=base-30,30<=cap<=86400.
Reference now-30days<=start<end<=base, start<=now. Hard=base+cap. All exercise,
accept and review upper bounds use now<deadline; equality is late. Recovery uses
now>=effective for READY or now>=hard for unresolved; equality permitted. Unpaid
cancel uses now>=accept. Each entrypoint checks caller/state/time before mutation.
Withdraw/zero-close N/A time: credits never expire, closure requires zero liability.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| create_lease | Sender becomes issuer | Fresh ID | Existing/invalid | Exact bounds above | Duplicate reject | No value; OFFERED | lease/clock/accounting | duplicate/bad bounds/zero buyer/value/invalid IDs |
| accept | Exact buyer | OFFERED | All others | now<accept and base | Once | Exactly1GEN escrow; REVIEWABLE | lease/credit/accounting | wrong caller/digest/value/state/replay/deadline-1/equal/+1 |
| review_clock | Issuer or buyer | REVIEWABLE/RETRYABLE attempts<3 | Unpaid/READY/terminal | now<hard cutoff | Append attempt; final once | Source/model failure retry only; valid vector sets READY and deadline; no money | clock/attempt/lease/accounting | outsider/state/duplicate/attemptcap/malformed/auth/schema/clock/dissent, state/accounting unchanged |
| exercise | Exact buyer | READY unused | Pending/terminal | now<effective deadline | One-time | Consumes protocol right; escrow1->issuer credit1 | lease/clock/credit/accounting | wrong actor/state/late boundary/duplicate/value/invariant |
| recover | Either party | READY due or unresolved due | OFFERED/terminal | READY now>=effective; unresolved now>=hard cutoff | Refund once | escrow1->actual buyer credit1 | lease/credit/accounting | premature/wrong caller/state/duplicate; stalephase all boundaries |
| cancel_unpaid | Either named party | OFFERED | Funded/terminal | now>=accept deadline | Once | CANCELLED, no value | lease/accounting | stranger/premature/boundaries/funded/duplicate |
| withdraw | Exact credit_to | EXERCISED/REFUNDED credit1 | Zero/other/closed | N/A permanent credit | Debit once | credit1->withdrawn1 EVM same EOA | credit/accounting + native/child/recipient proof | stranger/zero/value/duplicate/state/ledger; closed never strands credit |
| close_lease | Either named party | EXERCISED/REFUNDED fully withdrawn or CANCELLED | Open/outstanding escrow or credit/CLOSED | N/A, liabilities fully discharged | Once | CLOSED, zero liability | lease/accounting | wrong caller/pending credit/escrow/duplicate, no orphan |

## Frontend lifecycle coverage matrix

N/A for this contract-only track; scripts never count as browser execution.

## Evidence policy

Fixed URL https://status.openai.com/api/v2/incidents.json; exact OpenAI page ID
01JMDK9XYNY6RXSED6SDWW50WY; policy OC_V1. No caller URL/artifact body accepted.
HTTPS acquisition by each validator; status200 and1000..300000bytes; at most100
feed records. Selected incidents each unique, correct page_id and RESOLVED. Updates
unique and bound incident_id, timezone-aware timestamps, ordered display_at,
first timestamp equals created_at, last resolved equals resolved_at, all relevant
timestamps <=current transaction time and created within30day agreed reference.
Do not assume created_at order equals display order. Exactly one final resolved
update; no earlier resolved/reopened timeline accepted in V1.

Each non-resolved update starts a [display_at,next_display_at) interval. This
contractual reporting proxy is not actual customer uptime. Segment ID/time/status/
body/title are source-authoritative. Models judge channel meaning only. Selected
normalized source records are hashed from the exact representation used for review
and compared on independent replay; unrelated feed records never enter that digest.
No submitted hash authenticates external truth. Missing/outage/malformed/wrong page/
future/stale/binding/conflict -> source RETRYABLE without clock/right/value change.
Model ambiguity -> RETRYABLE. Invalid output reverts before consequence. All retries
append source stage/reason safely; hard cutoff still refunds actual payer.

### Evidence Authority Matrix

| Consequential claim/fact | Evidence/artifact | Data controller | Authoritative source/issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness/anti-replay | Semantic role after verification | Non-penalizing failure state | Consequence blocked | Required negative test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal lease exists | Immutable terms | Issuer wallet | Signed create transaction | Unique bounded ID/actors/time/scope | network/contract/OC_V1/lease/all terms | Unique ID and tx time | Fixed channel only | Revert unchanged | No lease/clock/credit | wrong entity/value/bounds |
| Buyer funded exact terms | Digest/value/paid state | Buyer wallet/runtime | Actual signed transaction context | exact sender/digest/value1GEN and state | Entire lease/price/deadline/source in recomputed digest | one acceptance, now<accept | Review eligibility only | Revert unchanged | No activation/reclassification | correct digest wrong caller/entity/version/value; replay/stale |
| Official interval facts | Feed selected records | OpenAI | Fixed official HTTPS origin/page | HTTP/size/JSON/IDs/page/status/update/time guards above | selected incident/update IDs and objective scope separate | resolved<=tx time,30day horizon, each fetch | interval-specific applicability only | RETRYABLE | No clock/exercise/credit | fabricated valid-hash wrongpage/incident/update/bounds/future/sourcehost |
| Validator decision | complete classes/source digest/intervals | Independent validators | authenticated source plus locked terms | exact ID coverage/enums/endpoints, no duplicate keys | lease/digest/attempt and exact source representation | one final clock,3attempts | semantic enums only | Revert or RETRYABLE | No deadline/money/right | malicious shape-valid dissent,extra/missing IDs,injected payout/authority |
| Exercise/refund/withdraw authority | Current state/caller/time | Contract/runtime | canonical ledger and signed caller | buyer-only exercise, due-party recovery, owncredit withdrawal | fixed lease parties/deadlines/destinations | one debit/allocation/exercise | None deterministic | Revert unchanged | No money/exercise | wrongcaller/state/clock/replay/duplicate and unchanged accounting |

Untrusted text cannot redefine authority, canonical objective, selected IDs,
window, timestamp, amount, destination or deadline. Prompts separate canonical
scope from quoted data. No signer-string/image/hash is treated as origin evidence.

## Consensus design

Leader fetches/validates source before LLM. Expected segment IDs/endpoints derived
by code. Model returns {classes:{exact_segment_id:enum},reason:string}; enums are
APPLIES,NOT_APPLIES,UNVERIFIABLE. Strict complete classes, unique JSON keys, no
missing/extra/duplicate IDs. Ignore unrelated metadata/rationale wording. Validator
rejects non-Return leader, independently fetches/replays and compares exact source
digest, interval identities/endpoints and complete semantic classes. Legacy
sandboxed gl.vm.run_nondet on matched v0.2.16; no run_nondet_unsafe.
UNDETERMINED creates no canonical success, clients inspect dynamic attempt count;
no blind retries. RETRYABLE never finalizes a deadline or allocates funds.

## Consequence and accounting

For APPLIES intervals, clip to reference [start,end), sort and union overlaps and
touching intervals; sum exact integer seconds. extension=min(total,cap).
Effective=base+extension. UNVERIFIABLE anywhere blocks entire clock finalization.
NOT_APPLIES intervals add0. Model supplies neither time nor payouts.
Exercise at now<effective consumes one internal right and changes escrow1 to issuer
credit1. Recovery at due deadline changes escrow1 to actual buyer credit1. All
value destinations fixed, no fees/slashing/remainders. received=withdrawn+escrow+
credit globally and perlease; nonnegative and one1GEN deposit maximum.
Debit credit before finalized EVM recipient transfer; receipt finality alone or
zero ledger is not proof. Require exact contract decrease1GEN, recipient evidence
and parent/child/value/address binding. Consensus applies on finalized state.
Cure/appeal/restore N/A; pending retry and timed refund are complete recovery paths.

### Value-destination matrix

| Value branch | Source | Locked | Release | Refund | Forfeit | Terminal/retry/duplicate | Canonical proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accepted1GEN | Exact buyer | Unresolved/READY escrow1 | Issuer credit1 only buyer valid exercise | Buyer credit1 at verified expiry or pending hardcutoff | None | RETRYABLE retains escrow until due recovery; one allocation | lease/clock/accounting |
| Exercised credit1 | Existing escrow | Issuer credit1 | Same issuer EOA | N/A valid consumed right | None | Permanent collectible; duplicate withdraw fails | credit/native balance/child receipt/recipient balance |
| Unused/pending recovery1 | Existing escrow | Buyer credit1 | Same buyer EOA | Original actual payer only | None | All sourcefail/attemptcap/no review branches recover at hardcutoff; one debit | Same proof |
| Unaccepted offer | No payer/no value | Zero | None | None | None | Cancel then close; zero everywhere | lease/accounting |

## Reusable interface

Writes create_lease,accept,review_clock,exercise,recover,cancel_unpaid,withdraw,
close_lease. Views get_lease,get_clock,get_attempt,get_credit,get_accounting,
get_policy. No callback/pass-through consumer. Caller authentication is inside
each write; IDs and terminal flags enforce idempotency. A LangGraph retry broker
uses lease/clock/exercise; A2A entitlement gateway reads finalized clock and buyer
exercise; DAOhaus mandate adapter uses due recovery and credits. Proposed only.

## Threat model

Forged provider/caller; wrong page/incident/update binding; future/stale/replayed
facts; source/body size abuse; duplicate keys; prompt injection; opposite semantic
leader vector; model timestamp/payout invention; double-count overlaps; cap overflow;
missing source/attempt exhaustion; issuer disappears; stale phase clock bypass;
duplicate exercise/refund/withdraw; orphan credit. Guards described above and
required tests below. External title/performance claims are excluded.

## Test plan

Test-first money/recovery implementation. cover all8 write wrong actor/state/value,
duplicate/terminal cases; every temporal boundary-1/equal/+1 with stale phase and
unchanged snapshot on rejection. Complete parserauthmalformed fixtures, exact
digest tripwires, invalidshape/output meaning, independent validator replay,
different rationale but same decisions, source outage/ambiguity unchanged money,
attemptcap hard recovery, entity isolation, union overlaps/touching/clipping/cap,
one-time exercise, own EVM ledger and child proof. AST metadata and real exact-
source schema supplement direct mode. Raw/normalized receipt tests; no critical skip.

## Claim-to-code matrix

| Claim | Contract method/state | View/read | Test | Network evidence |
| --- | --- | --- | --- | --- |
| Actual buyer bound1GEN acceptance | accept/digest/escrow | lease/accounting | acceptauthvalueclock | Paid lifecycle accept receipt/value/canonical escrow |
| Official interval authority | review_clock/source guards | attempt/clock | sourcebindingprovenance | real selected source/digest/stage in finalized attempt |
| Meaning controls time, not prose | review_clock/classes | attempt | semanticreplay/dissent | finalized affected/unaffected cases |
| No overlapping-time duplication | clipped union/cap | clock | union/clipping/cap | actual deadline/extension read |
| Exercise restored after base expiry | exercise/EXERCISED | lease/clock | exerciseboundary | buyer actual exercise after base before effective |
| Actual payer recovery | recover/REFUNDED | credit/accounting | verifiedexpiry/hardrecovery | due expiry and unresolved recovery refund receipts |
| Exact own-wallet exit | withdraw/EVM | credit/accounting/native | transfer/invariant/double | bound child/exact native/recipient1GEN delta |
| Immutable isolation/reuse | create/views | lease/policy | isolation/lockedfields | distinct successful/recovery IDs; documented APIs |

## Analogue and differentiation matrix

IncidentScope shares source/incentives but outputs batch membership/pro-rata credits,
not interval clock/exercise-refund exclusivity. EpisodeCap partitions causal events,
not unioning temporal spans. ParityOption matches competing offers for an exclusive
reservation window; no outside buyer here. ScopeExit cancels dependency closure;
no scope graph here. SemanticNonce guards novelty; no reworded replay budget here.
PartitionSeal partitions conserved scope; no subdivision/root retirement here.
Chainlink sequencer feed is objective uptime with grace period, without semantic
mode interpretation or this paid lease ownership. No4 material fingerprint matches
in bounded registry/ecosystem comparison. No existing product code extracted.

## Deployment and evidence plan

Owner-selected Studionet61999, exact legacy pragma/hash/import/base/API coherent.
Two existing authorized root.env EOAs; project.env first (empty fallback), no key
output/new wallets/faucet. Exact source commit, hash, schema and bounded smoke
before value. Resume from persisted signed hash; no duplicate broadcasts after
ambiguous outcomes. One active deployment; archive any replaced source and recover
its value or explicitly abandon broken revision without further deposits.
Evidence docs/evidence/studionet; no Studio Dev relabeling. Real1GEN percase:
affected Costs channel clock then wait nominal deadline and buyer exercise before
cap-restored deadline; issuer withdraw. Unaffected API channel0extension then due
refund/buyer withdraw. Unreviewed paid lease hardcutoff recovery/buyer withdraw.
Each case closes zero liability; one diagnostic outside product count.
Safe allowlisted statuses/IDs/values/canonical reads only. Verify public source,
Explorer address/tx, CI and unchanged grading command with actual project/address.

## Definition of Done

All11 phases,14 gates and6 directives with proof; production ASCII/header/one class
lint; full direct/metadata/parser tests and npmcheck; real meaningful judgment,
exercise-after-nominal-expiry, exact native recovery/withdraw and canonical reads;
zero liability; public hygiene/history/GitHub/CI; verified links and copy-ready
description<1000; unchanged grader0BLOCKER; final master reread and item audit.
Projects N/A. Completion/Portal submission never inferred from design alone.

## Honest limitations

Internal protocol entitlement only; historical agreed reference window is allowed
but no right is claimed to predate acceptance. Exact locked incident set is not
exhaustive history. Reporting-timestamp proxy is not measured customer downtime.
Status source controls its published facts; disappearing/changed feed can force
retry/refund.2..16updates/incident,1..3incidents,3attempts,one1GEN right. No browser
app, external gateway execution, legal right or adopter. Live evidence pending.

## Kill criteria

Reject/redesign if semantic judgment optional, four-dimensional collision appears,
an unauthenticated artifact changes clock/value, overlap inflates time, direct
entrypoint time/caller guards missing, value orphaned, dissenting meanings pass,
or test/network/source claims exceed actual evidence.
