"""Generate a no-custody diagnostic from the exact production decision block.

The probe injects synthetic intervals instead of fetching official evidence.
It tests real GenVM model judgments, NOT evidence authenticity or production money.
Expected labels are never passed to the model. The production file is unchanged.
"""
import ast
import copy
import hashlib
import json
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "contracts/outage_clock.py").read_text(encoding="ascii")
module = ast.parse(source)
contract = next(n for n in module.body if isinstance(n, ast.ClassDef) and n.name == "OutageClock")
review = next(n for n in contract.body if isinstance(n, ast.FunctionDef) and n.name == "review_clock")
leader = next(n for n in review.body if isinstance(n, ast.FunctionDef) and n.name == "leader")
validator = next(n for n in review.body if isinstance(n, ast.FunctionDef) and n.name == "validator")
begin = next(i for i, n in enumerate(leader.body) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "digest" for t in n.targets))
semantic = copy.deepcopy(leader)
semantic.body = copy.deepcopy(leader.body[begin:])
decision_code = ast.unparse(semantic)
validator_code = ast.unparse(validator)
helpers = "\n\n".join(ast.unparse(n) for n in module.body if isinstance(n, ast.FunctionDef) and n.name in {"_no_value", "_unique_pairs", "_json", "_classes", "_critical"})
probe = "\n".join(source.splitlines()[:3]) + "\nimport json\nimport hashlib\n\n" + helpers + "\n\n"
probe += '''class OutageSemanticProbe(gl.Contract):
    report: str

    def __init__(self, cases_json: str):
        _no_value()
        cases = _json(cases_json)
        if not isinstance(cases, list) or not 1 <= len(cases) <= 3:
            raise gl.vm.UserError("bounded diagnostic batch required")
        reports = []
        for case in cases:
            scope, rows = case["scope"], case["rows"]
'''
probe += textwrap.indent(decision_code, "            ") + "\n"
probe += textwrap.indent(validator_code, "            ") + "\n"
probe += '''            result = gl.vm.run_nondet(leader, validator)
            _critical(result)
            reports.append({"id": case["id"], "classes": result["classes"],
                "reason": result["reason"], "source_digest": result["source_digest"]})
        self.report = json.dumps(reports, sort_keys=True)

    @gl.public.view
    def get_report(self) -> str:
        return self.report
'''
probe.encode("ascii")
path = ROOT / ".codex/semantic_probe.py"
path.parent.mkdir(exist_ok=True)
path.write_text(probe, encoding="ascii", newline="\n")
fidelity = {"productionSHA256": hashlib.sha256(source.encode()).hexdigest(),
            "probeSHA256": hashlib.sha256(probe.encode()).hexdigest(),
            "decisionASTSHA256": hashlib.sha256(ast.dump(semantic).encode()).hexdigest(),
            "validatorASTSHA256": hashlib.sha256(ast.dump(validator).encode()).hexdigest(),
            "sameProductionSemanticBlock": True, "sameProductionValidator": True,
            "syntheticInputOnly": True, "valueGEN": "0", "custody": False}
(ROOT / ".codex/semantic-probe-fidelity.json").write_text(json.dumps(fidelity, indent=2) + "\n")
print(json.dumps(fidelity))
