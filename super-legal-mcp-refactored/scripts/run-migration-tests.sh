#!/bin/bash
set -e

# Run Phase 7 test gates sequentially with explicit exit codes
# 0 = pass, 1 = parity fail, 2 = load fail, 3 = security/failure-injection fail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running parity gates..."
if ! npm run test:parity -- --runInBand; then
  echo "Parity gates failed"
  exit 1
fi

echo "Running load/latency tests..."
if ! npm run test:load -- --runInBand; then
  echo "Load/latency tests failed"
  exit 2
fi

echo "Running security and failure-injection tests..."
if ! npm run test:security -- --runInBand; then
  echo "Security/failure-injection tests failed"
  exit 3
fi

echo "All migration tests passed"

