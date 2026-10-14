"""Structured semantic audit regressions; mocks do not prove model accuracy."""
import copy
import pytest
from test_outage_clock import ID, SCOPE, j, mock, model, paid, snap


def audit(title="APPLIES", body="NOT_APPLIES", **flags):
    row = dict(title_scope="COVERS_TARGET", body_scope="UNSPECIFIED" if flags.get("generic") else "COVERS_TARGET", body_quote="" if flags.get("generic") else "Costs delayed, ordinary API inference unaffected.", title=title, body=body, generic=False, recovery=False, body_conflict=False)
    row.update(flags)
    return {"channel": SCOPE, "consistent": True, "intervals": {f"{ID}:u{k}": dict(row) for k in range(4)}}


@pytest.mark.parametrize("title,body", [("APPLIES", "NOT_APPLIES"), ("NOT_APPLIES", "APPLIES")])
def test_opposing_title_body_forces_retry_despite_boolean_approval(contract, direct_vm, direct_accounts, title, body):
    lease = paid(contract, direct_vm, direct_accounts)
    decisions = {f"{ID}:u{k}": body for k in range(4)}
    mock(direct_vm, decision=model(decisions), consistency=audit(title, body))
    ledger = contract.get_accounting()
    contract.review_clock(lease)
    assert j(contract.get_lease(lease))["state"] == "RETRYABLE"
    assert j(contract.get_clock(lease))["verified"] is False
    assert j(contract.get_clock(lease))["extension_seconds"] == 0
    assert contract.get_accounting() == ledger
    before = snap(contract, lease)
    with pytest.raises(Exception):
        contract.exercise(lease)
    assert snap(contract, lease) == before


@pytest.mark.parametrize("kind", ["old_boolean", "missing", "extra", "wrong_id", "bad_enum", "bad_granularity", "missing_granularity", "string_flag", "int_flag", "null_flag", "generic_scope", "generic_recovery", "invalid_recovery", "missing_flag", "extra_flag", "duplicate_json"])
def test_malformed_audit_never_sets_ready_or_changes_gen_ledger(contract, direct_vm, direct_accounts, kind):
    lease = paid(contract, direct_vm, direct_accounts)
    result = audit("APPLIES", "APPLIES")
    first = f"{ID}:u0"
    item = result["intervals"][first]
    if kind == "old_boolean": result = {"consistent": True}
    elif kind == "missing": del result["intervals"][first]
    elif kind == "extra": result["intervals"]["EXTRA"] = dict(item)
    elif kind == "wrong_id": result["intervals"]["OTHER:u0"] = result["intervals"].pop(first)
    elif kind == "bad_enum": item["title"] = "PAY"
    elif kind == "bad_granularity": item["title_scope"] = "ALL"
    elif kind == "missing_granularity": del item["title_scope"]
    elif kind == "string_flag": item["body_conflict"] = "false"
    elif kind == "int_flag": item["recovery"] = 1
    elif kind == "null_flag": item["generic"] = None
    elif kind == "generic_scope": item["generic"] = True
    elif kind == "generic_recovery": item.update(body="UNVERIFIABLE", generic=True, recovery=True)
    elif kind == "invalid_recovery": item["recovery"] = True
    elif kind == "missing_flag": del item["body_conflict"]
    elif kind == "extra_flag": item["payout"] = "100 GEN"
    elif kind == "duplicate_json": result = '{"consistent":true,"consistent":true,"intervals":{}}'
    mock(direct_vm, consistency=result)
    ledger = contract.get_accounting()
    contract.review_clock(lease)
    assert j(contract.get_lease(lease))["state"] == "RETRYABLE"
    assert j(contract.get_clock(lease))["verified"] is False
    assert contract.get_accounting() == ledger


def test_malformed_first_components_revert_before_attempt_or_gen_mutation(contract, direct_vm, direct_accounts):
    lease = paid(contract, direct_vm, direct_accounts)
    malformed = model()
    del malformed["intervals"][f"{ID}:u0"]["title_scope"]
    mock(direct_vm, decision=malformed)
    before = snap(contract, lease)
    with pytest.raises(Exception):
        contract.review_clock(lease)
    assert snap(contract, lease) == before


@pytest.mark.parametrize("title,body,flags,decision,verified", [
    ("UNVERIFIABLE", "NOT_APPLIES", {}, "NOT_APPLIES", True),
    ("APPLIES", "NOT_APPLIES", {"recovery": True}, "NOT_APPLIES", True),
    ("APPLIES", "UNVERIFIABLE", {"generic": True}, "APPLIES", True),
    ("NOT_APPLIES", "UNVERIFIABLE", {"generic": True}, "NOT_APPLIES", True),
    ("APPLIES", "APPLIES", {"body_conflict": True}, "APPLIES", False),
    ("UNVERIFIABLE", "UNVERIFIABLE", {}, "UNVERIFIABLE", False),
    ("APPLIES", "NOT_APPLIES", {}, "UNVERIFIABLE", False),
    ("UNVERIFIABLE", "NOT_APPLIES", {}, "APPLIES", False),
])
def test_refinement_recovery_continuation_and_dissent_have_distinct_effects(contract, direct_vm, direct_accounts, title, body, flags, decision, verified):
    lease = paid(contract, direct_vm, direct_accounts)
    decisions = {f"{ID}:u{k}": decision for k in range(4)}
    mock(direct_vm, decision=model(decisions), consistency=audit(title, body, **flags))
    ledger = contract.get_accounting()
    contract.review_clock(lease)
    assert j(contract.get_clock(lease))["verified"] is verified
    assert j(contract.get_lease(lease))["state"] == ("READY" if verified else "RETRYABLE")
    assert contract.get_accounting() == ledger


def test_one_conflict_preserves_other_interval_labels_but_blocks_entire_clock(contract, direct_vm, direct_accounts):
    lease = paid(contract, direct_vm, direct_accounts)
    result = audit("APPLIES", "APPLIES")
    result["intervals"][f"{ID}:u1"]["body"] = "NOT_APPLIES"
    mock(direct_vm, consistency=result)
    contract.review_clock(lease)
    intervals = j(contract.get_attempt(lease + ":T1"))["intervals"]
    assert [x["class"] for x in intervals] == ["APPLIES", "UNVERIFIABLE", "APPLIES", "APPLIES"]
    assert j(contract.get_lease(lease))["state"] == "RETRYABLE"
    assert j(contract.get_clock(lease))["extension_seconds"] == 0
    candidate = copy.deepcopy(direct_vm._captured_validators[-1][0])
    candidate["classes"][f"{ID}:u1"] = "NOT_APPLIES"
    before = snap(contract, lease)
    assert direct_vm.run_validator(leader_result=candidate) is False
    assert snap(contract, lease) == before


@pytest.mark.parametrize("title_scope,recovery", [("PARENT_ONLY", False), ("COVERS_TARGET", True)])
def test_code_derives_refinement_or_recovery_from_components_not_flat_model_enum(contract, direct_vm, direct_accounts, title_scope, recovery):
    lease = paid(contract, direct_vm, direct_accounts)
    parts = {f"{ID}:u{k}": {"title_scope": title_scope, "body_scope": "COVERS_TARGET", "body_quote": "Costs delayed, ordinary API inference unaffected.", "title": "APPLIES", "body": "NOT_APPLIES", "generic": False, "recovery": recovery, "body_conflict": False} for k in range(4)}
    # A flat model enum is untrusted metadata under the component protocol.
    # The actual semantic claims in BOTH assessments support NOT_APPLIES.
    first = {**model({f"{ID}:u{k}": "UNVERIFIABLE" for k in range(4)}), "intervals": parts}
    mock(direct_vm, decision=first, consistency={"channel": SCOPE, "intervals": parts})
    ledger = contract.get_accounting()
    contract.review_clock(lease)
    assert j(contract.get_clock(lease))["verified"] is True
    assert j(contract.get_clock(lease))["extension_seconds"] == 0
    assert j(contract.get_lease(lease))["state"] == "READY"
    assert contract.get_accounting() == ledger


@pytest.mark.parametrize("mutation", ["flat_class", "missing_assessments", "malformed_components", "missing_second"])
def test_settlement_invariants_reject_tampered_consensus_result_before_mutation(contract, direct_vm, direct_accounts, monkeypatch, mutation):
    import genlayer.gl.vm as vm_module
    lease = paid(contract, direct_vm, direct_accounts)
    mock(direct_vm)
    original = vm_module.run_nondet
    def forged(leader, validator):
        result = copy.deepcopy(original(leader, validator))
        if mutation == "flat_class": result["classes"][f"{ID}:u0"] = "NOT_APPLIES"
        elif mutation == "missing_assessments": del result["assessments"]
        elif mutation == "malformed_components": del result["assessments"][0]["intervals"][f"{ID}:u0"]
        elif mutation == "missing_second": result["assessments"][1] = None
        return result
    monkeypatch.setattr(vm_module, "run_nondet", forged)
    before = snap(contract, lease)
    with pytest.raises(Exception):
        contract.review_clock(lease)
    assert snap(contract, lease) == before
