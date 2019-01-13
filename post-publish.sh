#!/bin/sh

# Generate documentation. This script should not be run directly. Instead, run with `npm run doc` or `yarn doc`.
# Requires `jq`; `apt install -y jq`

set -e

VERSION=$(cat package.json | jq .version -r)
DOC_OUTPUT="doc/${VERSION}"

typedoc \
    --out "$DOC_OUTPUT" \
    --exclude **/*.test.ts \
    --exclude */*.test.ts \
    --excludePrivate \
    --mode file \
    --name "Event store ${VERSION}"
    src
