"""Forward all local-tool output on stdout without changing its exit status.

PowerShell 5.1 otherwise treats benign stderr logging as a terminating error
when the unchanged acceptance orchestrator redirects npm output.
"""
import subprocess
import sys

if len(sys.argv) < 2:
    raise SystemExit(2)
raise SystemExit(subprocess.call(sys.argv[1:], stderr=subprocess.STDOUT))
