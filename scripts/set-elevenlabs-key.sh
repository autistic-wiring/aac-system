#!/usr/bin/env bash
# Store your ElevenLabs API key as a Kubernetes Secret (namespace: asd).
#
# The key is typed blind (no echo), never printed, never passed as a CLI arg
# (invisible to `ps`/history), staged only in a 0600 temp file that is
# shredded right after use, and never written into the repo.
#
# Usage:
#   ./scripts/set-elevenlabs-key.sh
#
set -euo pipefail

SECRET="elevenlabs-api-key"
NAMESPACE="asd"
FIELD="api-key"

command -v kubectl >/dev/null 2>&1 || { echo "missing dependency: kubectl" >&2; exit 1; }

# < /dev/tty so the prompt works even if stdin is redirected.
read -rs -p "ElevenLabs API key: " KEY < /dev/tty
echo
[[ -n "${KEY:-}" ]] || { echo "empty key, aborting (nothing stored)" >&2; exit 1; }

tmp="$(mktemp)"
chmod 600 "${tmp}"
trap 'shred -u "${tmp}" 2>/dev/null || rm -f "${tmp}"' EXIT
printf '%s' "${KEY}" > "${tmp}"
unset KEY

kubectl -n "${NAMESPACE}" create secret generic "${SECRET}" \
  --from-file="${FIELD}=${tmp}" \
  --dry-run=client -o yaml | kubectl apply -f - >/dev/null

echo "stored: secret/${SECRET} in namespace ${NAMESPACE}"
echo "verify (key names only, values never shown):"
kubectl -n "${NAMESPACE}" describe secret "${SECRET}" | grep -E '^(Name|Namespace|Type|[a-z-]+:)' || true
