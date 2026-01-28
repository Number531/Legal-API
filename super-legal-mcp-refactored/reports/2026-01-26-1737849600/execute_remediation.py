#!/usr/bin/env python3
import subprocess
import sys

result = subprocess.run([
    sys.executable,
    "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/neutralize_advocacy.py"
], capture_output=True, text=True)

print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr, file=sys.stderr)

sys.exit(result.returncode)
