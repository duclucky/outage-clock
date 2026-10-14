$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:PYTHONUTF8='1'
$env:GENVM_VERSION='v0.2.16'
& .\.venv\Scripts\python.exe scripts/source_check.py
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& .\.venv\Scripts\genvm-lint.exe check contracts/outage_clock.py
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& .\.venv\Scripts\python.exe scripts/local_tool.py .\.venv\Scripts\gltest.exe tests/ -q --tb=short
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& node --test tests/receipts.test.mjs
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
foreach($script in Get-ChildItem -LiteralPath scripts -Filter '*.mjs'){
 & node --check $script.FullName
 if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
}
