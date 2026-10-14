"""Relation and status are independent; source quotes do not prove meaning."""
import copy
import pytest
from test_outage_clock import ID, SCOPE, j, mock, paid, snap, source


@pytest.mark.parametrize("relation,expected", [("UNRELATED", "NOT_APPLIES"), ("PARENT_ONLY", "UNVERIFIABLE"), ("COVERS_TARGET", "APPLIES")])
def test_other_service_impairment_is_not_target_impairment(contract, direct_vm, direct_accounts, relation, expected):
    lease = paid(contract, direct_vm, direct_accounts)
    body = source()
    for update in body["incidents"][0]["incident_updates"]:
        update["body"] = "Codex requests are slower. No other product is affected."
    body["incidents"][0]["name"] = "Codex performance"
    parts = {f"{ID}:u{k}": dict(title_scope=relation, body_scope=relation, title="APPLIES", body="APPLIES", body_quote="Codex requests are slower.", body_kind="STATUS_ASSERTION", recovery=False, body_conflict=False) for k in range(4)}
    assessment = {"channel": SCOPE, "intervals": parts}
    mock(direct_vm, body=body, decision=assessment, consistency=assessment)
    ledger = contract.get_accounting()
    contract.review_clock(lease)
    rows = j(contract.get_attempt(lease + ":T1"))["intervals"]
    assert all(row["class"] == expected for row in rows)
    assert j(contract.get_clock(lease))["verified"] is (expected != "UNVERIFIABLE")
    assert contract.get_accounting() == ledger


@pytest.mark.parametrize("mutation", ["wrong_echo", "missing_echo", "forged_quote", "missing_quote", "invalid_relation", "generic_named_scope", "recovery_other_scope"])
def test_invalid_relational_premise_cannot_mutate_state_or_gen(contract, direct_vm, direct_accounts, mutation):
    from test_outage_clock import model
    lease = paid(contract, direct_vm, direct_accounts)
    answer = copy.deepcopy(model())
    first = answer["intervals"][f"{ID}:u0"]
    if mutation == "wrong_echo": answer["channel"] = "Different operation"
    elif mutation == "missing_echo": answer.pop("channel", None)
    elif mutation == "forged_quote": first["body_quote"] = "Invented official assertion"
    elif mutation == "missing_quote": first.pop("body_quote", None)
    elif mutation == "invalid_relation": first["body_scope"] = "ALL"
    elif mutation == "generic_named_scope": first.update(body_kind="CONTEXT_NOTE", body="UNVERIFIABLE", body_scope="COVERS_TARGET", body_quote="")
    elif mutation == "recovery_other_scope": first.update(recovery=True, body="NOT_APPLIES", body_scope="UNRELATED")
    mock(direct_vm, decision=answer)
    before = snap(contract, lease)
    with pytest.raises(Exception): contract.review_clock(lease)
    assert snap(contract, lease) == before
