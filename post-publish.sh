#!/bin/sh

# Post-publish hook. This script should not be run manually.
# Debugging can be performed with `PATH="$PATH:$(npm bin)" ./post-publish.sh`
# Requires `jq`; `apt install -y jq`

set -e

VERSION=$(cat package.json | jq .version -r)
DOC_OUTPUT="./doc/${VERSION}"
DOC_INDEX="./doc/index.html"
# Temporary folder to add and upload new docs from
GH_PAGES_WORKTREE=".gh-pages-tmp"

npm install

echo "Build docs for version ${VERSION}"

git worktree remove --force "${GH_PAGES_WORKTREE}" || true
git worktree add "${GH_PAGES_WORKTREE}" gh-pages

cd "${GH_PAGES_WORKTREE}"

# Update gh-pages from remote
git checkout gh-pages
git fetch origin
git rebase origin/master

npm run doc -- --out "$DOC_OUTPUT" --name "Event store ${VERSION}"

# Create a redirect from /doc to the latest version under /doc/a.b.c
echo "<meta http-equiv=\"refresh\" content=\"0; url=https://repositive.github.io/event-store/doc/${VERSION}\" />" > "${DOC_INDEX}"

echo "Adding generated docs"
git add -f "${DOC_INDEX}"
git add -f "${DOC_OUTPUT}"
echo "Comitting"
git commit -m "Add documentation for version ${VERSION}" || true

echo "Uploading docs for version ${VERSION} to gh-pages"
git push -f origin gh-pages

git worktree remove "${GH_PAGES_WORKTREE}"

echo
echo "Success"
