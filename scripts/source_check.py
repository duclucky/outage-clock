import ast
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=(root/'contracts/outage_clock.py').read_text(encoding='utf8')
source.encode('ascii')
assert source.splitlines()[:3]==['# v0.2.16','# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }','from genlayer import *']
classes=[n for n in ast.parse(source).body if isinstance(n,ast.ClassDef) and any(ast.unparse(b)=='gl.Contract' for b in n.bases)]
assert len(classes)==1 and classes[0].name=='OutageClock'
assert all(not(root/name).exists() for name in ['frontend','app','src/app'])
assert 'run_nondet_unsafe' not in source and 'gl.chain.Account' not in source and 'strict_eq' not in source
writes={};payable=[]
for n in classes[0].body:
    if isinstance(n,ast.FunctionDef):
        decorators=[ast.unparse(d) for d in n.decorator_list]
        if 'gl.public.write' in decorators or 'gl.public.write.payable' in decorators:
            writes[n.name]=ast.unparse(n)
        if 'gl.public.write.payable' in decorators:payable.append(n.name)
assert payable==['accept']
assert len(writes)==8
for name in ['create_lease','accept','review_clock','exercise','recover','cancel_unpaid']:
    assert '_now()' in writes[name]
assert '_Recipient(gl.message.sender_address).emit_transfer(value=u256(GEN))' in source
print('ASCII_HEADER_CLASS_METADATA_TEMPORAL_NO_APP_OK: OutageClock,14methods,accept payable1GEN')
