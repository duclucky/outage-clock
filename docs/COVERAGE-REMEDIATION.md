# Operational coverage clarification, before the next implementation

OC_V5's real-model RED is retained. S10/S11 both finalized with UNVERIFIABLE
instead of their unchanged APPLIES expectations. Exact constructor/source/
target/prompt/quote bindings were checked. The assessments disagreed about
EXACT versus BROAD despite naming the same Costs operation. A failed S07-S09
batch also exposed this exact granularity disagreement for S07; those outputs
are provisional, not canonical verdicts and not counted as observed successes.
Both S10/S11 selected genuine provider assertions and excluded the injection/
customer quote. The evidence does not support an attribution-parser cause.

The implementation must clarify operation coverage, rather than demand that a
source repeat every word in a free-form target. Use semantic relations
COVERS_TARGET/PARENT_ONLY/UNRELATED/UNSPECIFIED for title and body. COVERS_TARGET
means a report identifies the requested operation/data kind and covers required
mode qualifiers, including synonymous wording and context from the incident
title. PARENT_ONLY identifies only a platform/service family without the needed
operation or mode. This preserves the original BROAD definition, not an exemption
from it. Ordinary resource descriptions are not unique customer identifiers;
explicit tenant/model/region/tier/mode restrictions still require evidence coverage.
Do not infer that every narrow channel is impaired from a parent-platform report.
Coverage is reported-channel meaning, never proof of actual per-customer downtime.

Keep exact target acknowledgments, source-span membership, actual prompt hashes,
all deterministic settlement checks and two independent source judgments. Rename
internal relation enums to avoid the misleading word EXACT; public API/verdicts,
all existing expected labels, temporal guards,1GEN destinations and recovery
behavior stay unchanged. Existing review_clock safety row applies; all malformed
relations, forged bindings, unauthorized/wrong-state/late/duplicate writes and
unchanged-accounting negatives remain required. No fixed brand/service keyword
matcher or hardcoded scenario answer may replace semantic evaluation.

Preserve OC_V5's ongoing48-run source/corpus/receipts immutably. Its failures and
pending batch cannot be called PASS. Design/prepare the next candidate separately
while this campaign finishes; do not reinterpret or overwrite V5 observations.
The next full campaign must keep all24 cases unchanged and add prelocked coverage
controls for a same-operation paraphrase, parent-only evidence, explicit different
tenant scope and a similarly named different operation. Freeze them before any
model call. No new production deployment/payment before the complete new semantic
gate, source/lint/direct checks and independent network re-verification pass.

The real-model failures are the accuracy RED. Mocked unit tests verify protocol
responses and input integrity; they cannot prove that an LLM interprets the new
coverage relation correctly or that all future judgments will be accurate.

Version will be OC_V6. Preserve V5 source/probe by version and Git hash so its
running diagnostic remains independent of the next working candidate. The new
corpus has28cases/two repetitions,56planned observations; its first24 cases are
byte-for-byte equivalent JSON objects to V5. No V5 failed/pending outcome is erased.

## Local checkpoint before OC_V6 model calls

`npm run check`:447 Python +33 Node =480 passed,zero skips. Lint3checks and
validation passed, OutageClock14methods (8writes/6views), ASCII header and sole
payable accept1GEN metadata verified. Focused relation/input/conflict tests:51
passed. Source-span variation remains semantically equivalent in validator replay.
The no-custody diagnostic passed lint, one view/zero writes. All existing public
verdicts, expected labels, financial/time guards and recovery destinations remain.

SourceSHA256:eb3a72dad40f885ca5d6fc9de8b5d33b3451f7f796078f392d33415175b07be4.
ProbeSHA256:901b262b6fcbf801760fc1e52e7579c8d79b73ee1e581b31a1981ce3c4e8ba1a.
CorpusSHA256:1b1dc2b1593da9a08c090982590bb4758c962ac46713f7ee1f2396327def87bc.
All24 predecessor case objects are unchanged. V5 source/probe are preserved by
version; continuing V5 transactions still use the old exact source43844136...
with production source28d6bf16..., independent of the working V6 candidate.

The selected SDK RPC transport is now bounded20seconds including body reads.
Caller cancellation is preserved; other URLs are unaffected. Identity/balance
query errors are silenced before safe error projection. Four transport/privacy
regressions pass. A broadcast timeout remains ambiguous and the already-saved
hash must be read before any retry. Neither SDK nor runner version was upgraded.

No V6 model result, production deployment, GEN payment or submission exists at
this checkpoint. The56-run gate and fresh paid lifecycle remain mandatory.
