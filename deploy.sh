#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

branch="$(git branch --show-current)"
if [[ "$branch" != "main" ]]; then
  echo "Deploy from main so GitHub Pages receives the update (current branch: ${branch:-detached HEAD})." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or stash your changes before deploying; this script only publishes committed code." >&2
  exit 1
fi

npm run build
git push origin main
echo "Pushed main. GitHub Actions will build and publish the game to GitHub Pages."
