#!/usr/bin/env bash
set -euo pipefail

cases=(
  "correction|loose|you forgot to run typecheck|0"
  "correction|loose|don't worry about that|0"
  "correction|loose|let's add a feature|1"
  "coupling|loose|whenever I update StreamChunk we need to update ai-openai|0"
  "coupling|loose|this is unrelated to anything|1"
)

passes=0; fails=0
for case in "${cases[@]}"; do
  IFS='|' read -r key strict msg expected <<< "$case"
  patterns=$(jq -r --arg k "$key" --arg s "$strict" '.[$k][$s][]' "$(dirname "$0")/../lib/regex-patterns.json")
  matched=1
  while IFS= read -r p; do
    if echo "$msg" | grep -qE "$p"; then matched=0; break; fi
  done <<< "$patterns"
  if [ "$matched" = "$expected" ]; then
    passes=$((passes+1))
    echo "PASS: $key $strict: '$msg'"
  else
    fails=$((fails+1))
    echo "FAIL: $key $strict: '$msg' (got $matched, expected $expected)"
  fi
done

echo "Results: $passes passed, $fails failed"
exit $fails
