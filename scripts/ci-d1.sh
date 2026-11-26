#!/usr/bin/env bash
# Make sure the D1 database exists (create it on the first deploy) and put its id into wrangler.jsonc.
# Used by the Deploy workflow, so nobody has to run `wrangler d1 create` and paste an id by hand.
# WRANGLER can be overridden (the tests give it a fake).
set -euo pipefail
cd "$(dirname "$0")/.."
WR=${WRANGLER:-npx wrangler}
NAME=yuris

find_id() { $WR d1 list --json | jq -r --arg n "$NAME" '[.[] | select(.name == $n)][0].uuid // empty'; }

ID=$(find_id)
if [ -z "$ID" ]; then
  echo "creating D1 database $NAME"
  $WR d1 create "$NAME" >/dev/null
  ID=$(find_id)
fi
[ -n "$ID" ] || { echo "could not find or create the D1 database '$NAME'"; exit 1; }

sed -i -E "s/\"database_id\": \"[^\"]*\"/\"database_id\": \"$ID\"/" wrangler.jsonc
echo "D1 $NAME = $ID"
