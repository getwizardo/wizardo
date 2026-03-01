#!/usr/bin/env bash

set -e

VERSION=$(node -p "require('./package.json').version")
SEASON=${1:-release}

BRANCH="v${VERSION}-${SEASON}"
TAG="v${VERSION}-${SEASON}"

git config --global user.name "lunalov2"
git config --global user.email "lunalov2@users.noreply.sr.ht"

echo "Building project..."
npm run build

echo "Preparing dist repo..."

cd dist

git init
git checkout -b "$BRANCH"

git add .
git commit -m "build: $BRANCH"

# Create git tag for prerelease
git tag -a "$TAG" -m "Release $TAG"

git remote add builds git@git.sr.ht:~lunalov2/wdo-builds || true
git push -f builds "$BRANCH"
git push -f builds "$TAG"

echo "Build published to builds repo branch: $BRANCH with tag: $TAG"