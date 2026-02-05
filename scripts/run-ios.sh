#!/bin/sh

set -eu

# TODO #78: Keep this wrapper only until final Expo SDK release includes
# the upstream dev-launcher fix and no local patching is required.
NODE_BINARY_PATH=''
if [ -f ios/.xcode.env.local ]; then
  NODE_BINARY_PATH=$(sed -n 's/^export NODE_BINARY=//p' ios/.xcode.env.local | tail -n 1)
fi

if [ -n "$NODE_BINARY_PATH" ] && [ -x "$NODE_BINARY_PATH" ]; then
  PATH="$(dirname "$NODE_BINARY_PATH"):$PATH"
  export PATH
  export NODE_BINARY="$NODE_BINARY_PATH"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required for iOS autolinking but 'node' is not on PATH." >&2
  echo "Install Node or set export NODE_BINARY=/absolute/path/to/node in ios/.xcode.env.local." >&2
  exit 1
fi

if [ -z "${NODE_BINARY:-}" ]; then
  export NODE_BINARY="$(command -v node)"
fi

# TODO #78: Remove this patch step once Expo ships the final SDK with the fix.
if [ -f ./scripts/patch-expo-dev-launcher.mjs ]; then
  bun ./scripts/patch-expo-dev-launcher.mjs
fi

exec expo run:ios "$@"
