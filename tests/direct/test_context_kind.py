"""Contextual progress and explicit uncertainty have different consequences."""
import pytest
from test_outage_clock import ID, SCOPE, j, mock, paid, source, snap


@pytest.mark.parametrize("kind,text,expected", [
    ("CONTEXT_NOTE", "We have applied the mitigation and are monitoring the recovery.", "APPLIES"),
    ("SCOPE_WITHDRAWAL", "We withdraw the Costs identification; the affected operation cannot yet be identified.", "UNVERIFIABLE"),
    ("STATUS_ASSERTION", "We cannot confirm whether the Costs endpoint is currently impaired or healthy.", "UNVERIFIABLE"),
])
def test_progress_inherits_title_but_explicit_uncertainty_never_does(contract, direct_vm, direct_accounts, kind, text, expected):
    lease = paid(contract, direct_vm, direct_accounts)
    body = source()
    for update in body["incidents"][0]["incident_updates"]: update["body"] = text
    parts = {f"{ID}:u{k}": dict(title_scope="COVERS_TARGET", title="APPLIES", body_scope="COVERS_TARGET" if kind == "STATUS_ASSERTION" else "UNSPECIFIED",
        body="UNVERIFIABLE", body_quote=text, body_kind=kind, recovery=False, body_conflict=False) for k in range(4)}
    answer = {"channel": SCOPE, "intervals": parts}
    mock(direct_vm, body=body, decision=answer, consistency=answer)
    ledger = contract.get_accounting()
    contract.review_clock(lease)
    rows = j(contract.get_attempt(lease + ":T1"))["intervals"]
    assert all(row["class"] == expected for row in rows)
    assert j(contract.get_clock(lease))["verified"] is (expected == "APPLIES")
    assert contract.get_accounting() == ledger
    if expected == "UNVERIFIABLE":
        before = snap(contract, lease)
        with pytest.raises(Exception): contract.exercise(lease)
        assert snap(contract, lease) == before


@pytest.mark.parametrize("mutation", ["invalid_kind", "missing_kind", "empty_context_span", "context_status", "context_recovery", "context_conflict", "withdrawal_recovery", "legacy_generic"])
def test_invalid_statement_components_reject_before_gen_or_state_mutation(contract, direct_vm, direct_accounts, mutation):
    from test_outage_clock import model
    lease = paid(contract, direct_vm, direct_accounts)
    answer = model()
    row = answer["intervals"][f"{ID}:u0"]
    if mutation == "invalid_kind": row["body_kind"] = "PAY"
    elif mutation == "missing_kind": del row["body_kind"]
    elif mutation == "legacy_generic": row["generic"] = True
    else:
        row.update(body_kind="CONTEXT_NOTE", body_scope="UNSPECIFIED", body="UNVERIFIABLE")
        if mutation == "empty_context_span": row["body_quote"] = ""
        elif mutation == "context_status": row["body"] = "APPLIES"
        elif mutation == "context_recovery": row["recovery"] = True
        elif mutation == "context_conflict": row["body_conflict"] = True
        elif mutation == "withdrawal_recovery": row.update(body_kind="SCOPE_WITHDRAWAL", recovery=True, body_scope="COVERS_TARGET", body="NOT_APPLIES")
    mock(direct_vm, decision=answer)
    before = snap(contract, lease)
    with pytest.raises(Exception): contract.review_clock(lease)
    assert snap(contract, lease) == before
