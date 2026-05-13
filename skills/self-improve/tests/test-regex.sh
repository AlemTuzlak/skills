#!/usr/bin/env bash
# Requires GNU grep. The `\b` word-boundary anchor is a GNU extension and is
# not supported by BSD grep on macOS. On macOS install GNU grep via Homebrew
# (`brew install grep`) and ensure `ggrep` is on PATH, or alias `grep=ggrep`
# for this test run.
set -euo pipefail

cases=(
  "correction|loose|you forgot to run typecheck|0"
  "correction|loose|don't worry about that|1"
  "correction|loose|next time please run lint|0"
  "correction|loose|let's add a feature|1"
  # `instead of` was dropped from correction.loose — too many false positives
  # in normal conversational phrasing. Should NOT match.
  "correction|loose|use foo instead of bar|1"
  "coupling|loose|whenever I update StreamChunk we need to update ai-openai|0"
  "coupling|loose|this is unrelated to anything|1"
  # `impacts?` was dropped from coupling.loose — too generic, false-positive
  # heavy. Should NOT match.
  "coupling|loose|the new layout impacts the header padding|1"
  # `if .+ changes?` was tightened to require an identifier-like subject so
  # conversational filler doesn't match. Should NOT match.
  "coupling|loose|everyone needs coffee when working|1"
  # Identifier-like subject still matches (the legitimate use case).
  "coupling|loose|if types.ts changes the changelog must too|0"
)

passes=0; fails=0
for case in "${cases[@]}"; do
  IFS='|' read -r key strict msg expected <<< "$case"
  patterns=$(jq -r --arg k "$key" --arg s "$strict" '.[$k][$s][]' "$(dirname "$0")/../lib/regex-patterns.json" | tr -d '\r')
  matched=1
  while IFS= read -r p; do
    [ -z "$p" ] && continue
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
