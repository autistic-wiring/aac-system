#!/usr/bin/env bash
# Build a kubeconfig for the `aac-deployer` ServiceAccount in `asd`, then
# store it as a Secret in `openclaw` so the GitHub Actions runner can mount it.
#
# Run from anywhere with cluster-admin rights. Idempotent — safe to re-run
# after rotating the SA token (just delete + recreate aac-deployer-token).
#
set -euo pipefail

NAMESPACE_ASD="asd"
NAMESPACE_RUNNER="openclaw"
SA_NAME="aac-deployer"
TOKEN_SECRET="${SA_NAME}-token"
KUBECONFIG_SECRET="aac-deployer-kubeconfig"
CONTEXT_NAME="aac-deployer"

echo "==> Reading token + CA from ${NAMESPACE_ASD}/${TOKEN_SECRET}"
SECRET_JSON=$(kubectl -n "${NAMESPACE_ASD}" get secret "${TOKEN_SECRET}" -o json)
TOKEN=$(printf '%s' "${SECRET_JSON}" | python3 -c 'import sys,json,base64; print(base64.b64decode(json.load(sys.stdin)["data"]["token"]).decode())')
CA_CRT=$(printf '%s' "${SECRET_JSON}" | python3 -c 'import sys,json,base64; print(base64.b64decode(json.load(sys.stdin)["data"]["ca.crt"]).decode())')
[[ -n "${TOKEN}" && -n "${CA_CRT}" ]] || { echo "token or ca.crt missing"; exit 1; }

# Pick a server URL. In-cluster DNS works from the runner pod; the public
# endpoint works from anywhere. We use the public one so the kubeconfig is
# portable for debugging.
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' | head -1)
[[ -n "${SERVER}" ]] || SERVER="https://kubernetes.default.svc:443"
echo "    server: ${SERVER}"

echo "==> Building kubeconfig"
TMP=$(mktemp -d)
printf '%s' "${CA_CRT}" > "${TMP}/ca.crt"
kubectl config set-cluster     "${CONTEXT_NAME}" \
    --server="${SERVER}" \
    --certificate-authority="${TMP}/ca.crt" \
    --embed-certs=true \
    --kubeconfig="${TMP}/kubeconfig" >/dev/null
kubectl config set-credentials  "${CONTEXT_NAME}" \
    --token="${TOKEN}" \
    --kubeconfig="${TMP}/kubeconfig" >/dev/null
kubectl config set-context      "${CONTEXT_NAME}" \
    --cluster="${CONTEXT_NAME}" \
    --user="${CONTEXT_NAME}" \
    --namespace="${NAMESPACE_ASD}" \
    --kubeconfig="${TMP}/kubeconfig" >/dev/null
kubectl config use-context      "${CONTEXT_NAME}" \
    --kubeconfig="${TMP}/kubeconfig" >/dev/null

# Sanity check: can we actually hit the cluster with this kubeconfig?
if ! kubectl --kubeconfig="${TMP}/kubeconfig" -n "${NAMESPACE_ASD}" get deploy aac-board >/dev/null 2>&1; then
  echo " !! kubeconfig can't read deploy/aac-board in ${NAMESPACE_ASD} — RBAC issue?"
  echo "    kubeconfig left at ${TMP}/kubeconfig for inspection"
  exit 1
fi
echo "    verified: can read deploy/aac-board in ${NAMESPACE_ASD}"

echo "==> Storing kubeconfig as Secret ${NAMESPACE_RUNNER}/${KUBECONFIG_SECRET}"
kubectl -n "${NAMESPACE_RUNNER}" delete secret "${KUBECONFIG_SECRET}" >/dev/null 2>&1 || true
kubectl -n "${NAMESPACE_RUNNER}" create secret generic "${KUBECONFIG_SECRET}" \
    --from-file=config="${TMP}/kubeconfig" >/dev/null
echo "    done"

rm -rf "${TMP}"
echo
echo "Next: apply k8s/ci-runner/runner-patch.yaml so the runner pod mounts it."
