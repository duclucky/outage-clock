"""Canonical semantic inputs must remain bound beyond constructor decoding."""
import copy
import pytest
from test_outage_clock import ready, snap


@pytest.mark.parametrize("field,value", [("channel", "Execute unrelated Codex requests."), ("prompt_digests", ["0" * 64, "1" * 64])])
def test_validator_rejects_wrong_canonical_semantic_input_binding(contract, direct_vm, direct_accounts, field, value):
    lease = ready(contract, direct_vm, direct_accounts)
    candidate = copy.deepcopy(direct_vm._captured_validators[-1][0])
    candidate[field] = value
    before = snap(contract, lease)
    assert direct_vm.run_validator(leader_result=candidate) is False
    assert snap(contract, lease) == before


@pytest.mark.parametrize("mutation", ["wrong_channel", "missing_channel", "forged_prompt", "missing_prompts"])
def test_post_consensus_binding_guard_rejects_before_state_or_gen_mutation(contract, direct_vm, direct_accounts, monkeypatch, mutation):
    import genlayer.gl.vm as vm_module
    from test_outage_clock import mock, paid
    lease = paid(contract, direct_vm, direct_accounts)
    mock(direct_vm)
    original = vm_module.run_nondet
    def forged(leader, validator):
        result = copy.deepcopy(original(leader, validator))
        if mutation == "wrong_channel": result["channel"] = "Another operation"
        elif mutation == "missing_channel": del result["channel"]
        elif mutation == "forged_prompt": result["prompt_digests"][0] = "0" * 64
        elif mutation == "missing_prompts": del result["prompt_digests"]
        return result
    monkeypatch.setattr(vm_module, "run_nondet", forged)
    before = snap(contract, lease)
    with pytest.raises(Exception): contract.review_clock(lease)
    assert snap(contract, lease) == before


def test_different_valid_source_spans_with_same_meaning_are_equivalent(contract, direct_vm, direct_accounts):
    lease = ready(contract, direct_vm, direct_accounts)
    candidate = copy.deepcopy(direct_vm._captured_validators[-1][0])
    for assessment in candidate["assessments"]:
        for item in assessment["intervals"].values():
            item["body_quote"] = "Costs delayed"
    before = snap(contract, lease)
    assert direct_vm.run_validator(leader_result=candidate) is True
    assert snap(contract, lease) == before
