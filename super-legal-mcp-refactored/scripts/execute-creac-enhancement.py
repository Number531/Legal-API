#!/usr/bin/env python3
"""
Execute CREAC header enhancement - W3-001-VALIDATE task
Reads final-memorandum-creac.md, adds 26 headers (13 Conclusion + 13 Rule), writes output
"""

import sys
from pathlib import Path

# Import the enhancement logic
sys.path.insert(0, str(Path(__file__).parent))

def main():
    # Define paths
    session_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000")
    input_file = session_dir / "final-memorandum-creac.md"
    output_file = session_dir / "remediation-outputs" / "W3-001-VALIDATE-creac-review.md"

    # Ensure output directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Execute enhancement
    import subprocess
    result = subprocess.run(
        [sys.executable, "add-conclusion-rule-headers.py", str(input_file), str(output_file)],
        cwd=Path(__file__).parent,
        capture_output=True,
        text=True
    )

    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr, file=sys.stderr)

    return result.returncode

if __name__ == '__main__':
    sys.exit(main())
