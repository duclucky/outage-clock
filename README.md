# OutageClock

Reusable GenLayer Intelligent Contract for a paid, one-use protocol entitlement
whose exercise deadline can be extended by agreed official disruption intervals.
Validators independently fetch the official OpenAI incident feed and interpret
each interval against the exact ratified service channel. Contract code clips,
unions and caps the reported lost seconds, so overlapping reports never multiply
time. A buyer's valid exercise credits the fixed issuer1GEN; due expiry or unresolved
hard recovery refunds the actual buyer1GEN. Only own-wallet credits are withdrawable.

Category: Intelligent Contracts. Owner-selected Studionet61999. No app/frontend.
One ASCII `OutageClock`,8writes/6views; pinned matched v0.2.16 runner and SDK1.1.8.
Deployment and paid execution are PENDING; local checks are not network proof.

## Validate

Python3.12: create `.venv`, install `requirements-dev.txt`, then `npm ci` and
`npm run check`. Current local result:101 Python direct cases and13 receipt cases,
semantic lint and AST metadata all pass, zero skipped.

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
