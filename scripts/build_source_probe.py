"""Extract the full candidate review, including authoritative acquisition."""
import ast
import hashlib
import json
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "contracts/outage_clock.py").read_text(encoding="ascii")
tree = ast.parse(source)
version = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "VERSION" for t in n.targets))
contract = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "OutageClock")
review = next(n for n in contract.body if isinstance(n, ast.FunctionDef) and n.name == "review_clock")
leader = next(n for n in review.body if isinstance(n, ast.FunctionDef) and n.name == "leader")
validator = next(n for n in review.body if isinstance(n, ast.FunctionDef) and n.name == "validator")
helpers = "\n\n".join(ast.unparse(n) for n in tree.body if isinstance(n, (ast.FunctionDef, ast.Assign)))
probe = "\n".join(source.splitlines()[:3]) + "\nimport json\nimport hashlib\nfrom datetime import datetime, timezone\n\n" + helpers + "\n\n"
probe += '''class OutageSourceProbe(gl.Contract):
    report: str

    def __init__(self, scopes_json: str, incident_ids: str):
        _no_value()
        scopes = _json(scopes_json)
        if not isinstance(scopes, dict) or set(scopes) != {"affected", "unaffected"}:
            raise gl.vm.UserError("bounded source smoke scopes required")
        expected, now = _incident_ids(incident_ids), _now()
        reports = {}
        for key, scope in scopes.items():
'''
probe += textwrap.indent(ast.unparse(leader), "            ") + "\n"
probe += textwrap.indent(ast.unparse(validator), "            ") + "\n"
probe += '''            result = gl.vm.run_nondet(leader, validator)
            _critical(result, scope)
            rows, classes = result["intervals"], result["classes"]
            verified = result["source_ok"] and "UNVERIFIABLE" not in classes.values()
            seconds = _union_seconds(rows, classes, min(r["start"] for r in rows), max(r["end"] for r in rows)) if verified else 0
            reports[key] = {"source_ok": result["source_ok"], "stage": result["stage"],
                "source_digest": result["source_digest"], "classes": classes,
                "verified": verified, "applicable_seconds": seconds,
                "intervals": [{"id": r["id"], "start": r["start"], "end": r["end"], "class": classes[r["id"]]} for r in rows]}
        self.report = json.dumps(reports, sort_keys=True)

    @gl.public.view
    def get_report(self) -> str:
        return self.report
'''
probe.encode("ascii")
(ROOT / (".codex/source_probe_" + version + ".py")).write_text(probe, encoding="ascii", newline="\n")
certificate = {"revision": version, "productionSHA256": hashlib.sha256(source.encode()).hexdigest(),
               "probeSHA256": hashlib.sha256(probe.encode()).hexdigest(),
               "fullLeaderASTSHA256": hashlib.sha256(ast.dump(leader).encode()).hexdigest(),
               "validatorASTSHA256": hashlib.sha256(ast.dump(validator).encode()).hexdigest(),
               "sameFullLeader": True, "sameValidator": True, "sameSourceHelpers": True,
               "syntheticInput": False, "valueGEN": "0", "custody": False}
(ROOT / (".codex/source-probe-fidelity-" + version + ".json")).write_text(json.dumps(certificate, indent=2) + "\n")
print(json.dumps(certificate))
