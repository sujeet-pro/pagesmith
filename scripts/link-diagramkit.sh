#!/usr/bin/env bash
# Link a local diagramkit checkout for development.
# Usage:
#   npm run link:diagramkit              # links ../diagramkit (sibling convention)
#   npm run link:diagramkit /custom/path # links from a custom location
set -euo pipefail

DIAGRAMKIT_DIR="${1:-$(cd "$(dirname "$0")/../.." && pwd)/diagramkit}"

if [ ! -d "$DIAGRAMKIT_DIR" ]; then
  echo "error: diagramkit not found at $DIAGRAMKIT_DIR"
  echo "Place the diagramkit repo as a sibling (../diagramkit) or pass a path:"
  echo "  npm run link:diagramkit /path/to/diagramkit"
  exit 1
fi

DIAGRAMKIT_DIR="$(cd "$DIAGRAMKIT_DIR" && pwd)"

echo "Linking diagramkit from $DIAGRAMKIT_DIR"
cd "$DIAGRAMKIT_DIR" && npm link
cd "$(dirname "$0")/.." && npm link diagramkit
echo "Done. diagramkit is now linked from $DIAGRAMKIT_DIR"
