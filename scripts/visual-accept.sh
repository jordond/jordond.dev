#!/usr/bin/env bash
# Accept the screenshots rendered by the latest Preview run on this branch as
# the new visual baselines. CI records them on Linux, which is the only
# platform the committed baselines are valid for.
#
# Usage: bun run visual:accept [branch]
set -euo pipefail

branch="${1:-$(git branch --show-current)}"
dest="tests/e2e/__screenshots__"

run=$(gh run list --workflow preview.yml --branch "$branch" --limit 1 \
  --json databaseId,status,conclusion \
  --jq '.[0] | select(.status == "completed") | .databaseId')

if [ -z "${run:-}" ]; then
  echo "No completed Preview run found for branch '$branch'." >&2
  exit 1
fi

mkdir -p "$dest"
if ! gh run download "$run" --name visual-baselines --dir "$dest"; then
  echo "Run $run has no 'visual-baselines' artifact." >&2
  echo "It is only uploaded when the visual tests fail or have no baseline." >&2
  exit 1
fi

echo
echo "Baselines from run $run written to $dest. Review, then commit:"
git status --short "$dest"
