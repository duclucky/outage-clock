"""Protocol robustness tests; mocked decisions do NOT measure LLM accuracy."""
import copy
import itertools
import json
import random
from datetime import datetime, timezone

import pytest
from test_outage_clock import NOW, ID, clock, j, mock, model, paid, ready, snap, source

ENUMS = ("APPLIES", "NOT_APPLIES", "UNVERIFIABLE")
VECTORS = list(itertools.product(ENUMS, repeat=4))


@pytest.mark.parametrize("seed", range(128))
def test_random_overlaps_clips_and_caps_match_independent_discrete_oracle(contract, direct_vm, direct_accounts, seed):
    rng = random.Random(seed)
    ids = [ID] + [f"INCIDENT{i}" for i in range(rng.randint(0, 2))]
    body = source(ids)
    decisions = {}
    eligible_seconds = set()
    ref_start, ref_end = NOW - rng.randint(900, 1350), NOW - rng.randint(550, 800)
    cap = rng.randint(30, 800)
    for incident in body["incidents"]:
        starts = [NOW - rng.randint(1100, 1450)]
        for _ in range(4):
            starts.append(starts[-1] + rng.randint(30, 120))
        for k, update in enumerate(incident["incident_updates"]):
            t = datetime.fromtimestamp(starts[k], timezone.utc).isoformat().replace("+00:00", "Z")
            update.update(display_at=t, created_at=t, updated_at=t)
            if k < 4:
                decision = rng.choice(ENUMS[:2])
                decisions[incident["id"] + ":" + update["id"]] = decision
                if decision == "APPLIES":
                    eligible_seconds.update(n for n in range(starts[k], starts[k + 1]) if ref_start <= n < ref_end)
        incident.update(created_at=incident["incident_updates"][0]["display_at"],
                        resolved_at=incident["incident_updates"][-1]["display_at"],
                        updated_at=incident["incident_updates"][-1]["display_at"])
    lease = paid(contract, direct_vm, direct_accounts, incident_ids=json.dumps(ids),
                 reference_start=ref_start, reference_end=ref_end, extension_cap=cap)
    mock(direct_vm, body=body, decision=model(decisions))
    contract.review_clock(lease)
    result = j(contract.get_clock(lease))
    assert result["reported_seconds"] == len(eligible_seconds)
    assert result["extension_seconds"] == min(cap, len(eligible_seconds))
    assert result["effective_deadline"] == NOW + 120 + min(cap, len(eligible_seconds))
    assert j(contract.get_accounting())["escrow_gen"] == "1"
    assert j(contract.get_accounting())["credit_gen"] == "0"


@pytest.mark.parametrize("vector", VECTORS)
def test_all_81_candidate_vectors_require_same_independent_meaning(contract, direct_vm, direct_accounts, vector):
    lease = ready(contract, direct_vm, direct_accounts)
    candidate = copy.deepcopy(direct_vm._captured_validators[-1][0])
    candidate["classes"] = {f"{ID}:u{k}": value for k, value in enumerate(vector)}
    # Supply internally consistent components too: rejection must still depend
    # on independent semantic replay, rather than a mismatched local schema.
    assessment = model(candidate["classes"])["intervals"]
    candidate["assessments"] = [{"intervals": copy.deepcopy(assessment)}, {"intervals": copy.deepcopy(assessment)}]
    before = snap(contract, lease)
    assert direct_vm.run_validator(leader_result=candidate) is (vector == ("APPLIES",) * 4)
    assert snap(contract, lease) == before


@pytest.mark.parametrize("vector", VECTORS)
def test_critic_rejection_blocks_every_possible_four_interval_vector(contract, direct_vm, direct_accounts, vector):
    lease = paid(contract, direct_vm, direct_accounts)
    decisions = {f"{ID}:u{k}": value for k, value in enumerate(vector)}
    mock(direct_vm, decision=model(decisions), consistency={"consistent": False})
    contract.review_clock(lease)
    assert j(contract.get_lease(lease))["state"] == "RETRYABLE"
    assert j(contract.get_clock(lease))["verified"] is False
    assert j(contract.get_clock(lease))["extension_seconds"] == 0
    assert j(contract.get_accounting())["escrow_gen"] == "1"
    assert j(contract.get_accounting())["credit_gen"] == "0"
    before = snap(contract, lease)
    with pytest.raises(Exception):
        contract.exercise(lease)
    assert snap(contract, lease) == before


def test_common_mode_model_error_is_a_witness_against_absolute_accuracy(contract, direct_vm, direct_accounts):
    """Characterize a LIMITATION, not a safety/accuracy guarantee or real LLM run.

    If every interpreter and critic makes the same semantic mistake, consensus
    cannot recover ground truth from matching enums. This counterexample must
    remain disclosed even if all structural tests pass.
    """
    lease = paid(contract, direct_vm, direct_accounts)
    wrong = {f"{ID}:u{k}": "NOT_APPLIES" for k in range(4)}
    mock(direct_vm, decision=model(wrong))
    contract.review_clock(lease)
    assert direct_vm.run_validator() is True
    assert j(contract.get_clock(lease))["verified"] is True
    assert j(contract.get_clock(lease))["extension_seconds"] == 0
    clock(direct_vm, NOW + 121)
    with pytest.raises(Exception):
        contract.exercise(lease)
    assert j(contract.get_accounting())["escrow_gen"] == "1"
    assert j(contract.get_accounting())["credit_gen"] == "0"
