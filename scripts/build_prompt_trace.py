"""Instrument exact prompt arguments; never alters production or its corpus."""
import ast
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT / "scripts/build_semantic_probe.py"), "--source-ref", "e415873917c792a9c5bb32efd0eeff913dc4e8be"], cwd=ROOT, check=True)
baseline = (ROOT / ".codex/semantic_probe.py").read_text(encoding="ascii")
assert hashlib.sha256(baseline.encode()).hexdigest() == "59743db75ee39b4dd7bdb71db2a0453e5dae55d00a21980af60d925ef742064d"
tree = ast.parse(baseline)


class Trace(ast.NodeTransformer):
    def visit_FunctionDef(self, node):
        if node.name != "leader":
            return self.generic_visit(node)
        node = self.generic_visit(node)
        setup = ast.parse('''prompts = []
def capture(prompt, **kwargs):
    prompts.append(prompt)
    return gl.nondet.exec_prompt(prompt, **kwargs)
''').body
        node.body = setup + node.body
        for part in ast.walk(node):
            if isinstance(part, ast.Return) and isinstance(part.value, ast.Dict):
                part.value.keys.append(ast.Constant("prompt_trace"))
                part.value.values.append(ast.Name(id="prompts", ctx=ast.Load()))
        return node

    def visit_Call(self, node):
        if ast.unparse(node.func) == "gl.nondet.exec_prompt":
            node.func = ast.Name(id="capture", ctx=ast.Load())
        return self.generic_visit(node)


tree = Trace().visit(tree)
# Trace setup is inserted after traversal, so its real SDK call is untouched.
for node in ast.walk(tree):
    if isinstance(node, ast.Call) and ast.unparse(node.func) == "reports.append":
        node.args[0].keys.append(ast.Constant("prompt_trace"))
        node.args[0].values.append(ast.Subscript(value=ast.Name(id="result", ctx=ast.Load()), slice=ast.Constant("prompt_trace"), ctx=ast.Load()))
ast.fix_missing_locations(tree)
source = "\n".join(baseline.splitlines()[:2]) + "\n" + ast.unparse(tree) + "\n"
(ROOT / ".codex/prompt_trace.py").write_text(source, encoding="ascii", newline="\n")
corpus = json.loads((ROOT / "tests/data/semantic-scenarios-v3.json").read_text())
prompt_node = next(n for n in ast.parse(baseline).body if isinstance(n, ast.FunctionDef) and n.name == "_scope_prompt")
namespace = {"json": json}
exec(compile(ast.Module(body=[prompt_node], type_ignores=[]), "original-prompt", "exec"), namespace)
scopes = [corpus["cases"][0]["scope"], "Execute GPT-6.1 Sol requests in Codex.", "Use realtime audio sessions."]
cases = []
for original, labels in [(corpus["cases"][1], ["NOT_APPLIES", "APPLIES", "NOT_APPLIES"]), (corpus["cases"][0], ["APPLIES", "NOT_APPLIES", "NOT_APPLIES"])]:
    for index, (scope, label) in enumerate(zip(scopes, labels)):
        cases.append({"id": original["id"] + "T" + str(index), "scope": scope, "rows": original["rows"], "expected": {r["id"]: label for r in original["rows"]}, "expectedPrompts": [namespace["_scope_prompt"](scope, original["rows"], second) for second in [False, True]]})
(ROOT / ".codex/prompt-trace-cases.json").write_text(json.dumps(cases, indent=2) + "\n")
print(json.dumps({"instrumentation": "capture exact exec_prompt arguments", "baselineProbeSHA256": hashlib.sha256(baseline.encode()).hexdigest(), "traceSHA256": hashlib.sha256(source.encode()).hexdigest(), "cases": len(cases), "valueGEN": "0"}))
