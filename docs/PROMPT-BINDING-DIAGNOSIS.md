# Prompt binding diagnosis before another production change

OC_V4 remains blocked by its preserved S02 counterexample. Constructor data
matching does not prove which string reached exec_prompt. Two hypotheses remain:
the prompt/closure pipeline loses the target, or the model misinterprets a
correctly bound target. No production behavior or expected label changes yet.

A zero-GEN, no-custody diagnostic will capture the exact string passed to each
exec_prompt call, alongside the unchanged production decision and validator.
Use the S02 evidence with three separately locked targets: Costs retrieval
(NOT_APPLIES), Codex requests (APPLIES), and realtime audio (NOT_APPLIES).
Also use the S01 Costs evidence with the same three targets (APPLIES,
NOT_APPLIES, NOT_APPLIES). Expectations are frozen here before any run and never
passed to the contract. One planned run of each, six observations total. Do not
retry a semantic mismatch or remove it from the denominator.

Exact prompt capture is instrumentation, not production fidelity by assertion:
record the AST substitution and both source hashes. Verify captured prompts
against the original production prompt function, the case target and rows.
Compare target-sensitive output across controls. This cannot estimate an
absolute future accuracy bound. The original 36-run failure remains valid.

## Confirmed missing binding invariant and safety row, before implementation

`gltest tests/direct/test_scope_binding.py -q --tb=short`:2 failed on unchanged
OC_V4. A forged channel or prompt-digest pair is ignored and validator replay
still accepts. This is a confirmed missing invariant, not proof that the old
S02 model call received the wrong channel.

The next revision must return its locked channel and the SHA256 of each actual
prompt argument. Independently regenerate those prompts from locked scope and
reviewed rows in the deterministic post-consensus boundary and validator replay.
Missing/forged bindings reject before any attempt/state/GEN mutation. This is
byte provenance validation in addition to independent semantic judgment; it must
never replace the meaning comparison. Existing eight write rows and value and
temporal matrices apply. review_clock callers/states/deadlines/retry limit remain
unchanged; affected views are lease, clock, attempt, accounting; unauthorized,
wrong-state, malformed binding and unchanged GEN/state negative tests are required.
No production promotion is authorized by these local binding tests alone.
