#!/usr/bin/env bash
# AAC deploy / rollback entrypoint.
#
# Mirrors what the GitHub Actions workflows do, for local fallback / hotfixes:
#   - feature branch push  -> .github/workflows/deploy-testing.yml
#   - main merge           -> .github/workflows/deploy-prod.yml
#
# Usage:
#   ./scripts/deploy.sh testing                # build HEAD, deploy to aac-testing
#   ./scripts/deploy.sh prod [version]         # build HEAD, tag vX.Y.Z, deploy to aac.nexvision.cc
#   ./scripts/deploy.sh rollback <version>     # point prod at a previous vX.Y.Z or :sha-<short>
#   ./scripts/deploy.sh status                 # show testing vs prod versions + recent tags
#
# Image tag layout (all in registry.nexvision.cc/nexvisioncc/aac-board):
#   :testing        — mutable, latest feature-branch build (testing deployment)
#   :stable         — mutable, latest main build           (prod deployment)
#   :sha-xxxx       — immutable, one per git commit        (rollback target)
#   :branch-<slug>  — immutable, one per feature branch    (traceability)
#   :vX.Y.Z         — immutable, one per prod release      (rollback target)
#
set -euo pipefail

REGISTRY="registry.nexvision.cc/nexvisioncc/aac-board"
NAMESPACE="asd"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"

# --- helpers -----------------------------------------------------------------
log()  { printf '\033[1;34m==>\033[0m %s\n' "$*" >&2; }
ok()   { printf '\033[1;32m ✓\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m ✗\033[0m %s\n' "$*" >&2; exit 1; }

require() { command -v "$1" >/dev/null 2>&1 || die "missing dependency: $1"; }
require docker
require kubectl
require git

short_sha()   { git -C "${K8S_DIR}/.." rev-parse --short HEAD; }
current_pkg_version() {
  node -e 'console.log(require("./package.json").version)' 2>/dev/null \
    || grep -m1 '"version"' "${K8S_DIR}/../package.json" | sed -E 's/[^0-9.]//g'
}

bump_patch_version() {
  local pkg_file="${K8S_DIR}/../package.json"
  local current_v; current_v="$(current_pkg_version)"
  local major minor patch
  IFS='.' read -r major minor patch <<< "${current_v}"
  patch=$((patch + 1))
  local new_v="${major}.${minor}.${patch}"

  # Sync remote tags, then keep bumping until we land on a version whose
  # tag isn't already used (locally or on origin) — avoids `git tag` conflicts.
  git -C "${K8S_DIR}/.." fetch --tags origin >/dev/null 2>&1 || true
  while git -C "${K8S_DIR}/.." rev-parse -q --verify "refs/tags/v${new_v}" >/dev/null 2>&1; do
    log "Tag v${new_v} already exists — bumping again"
    patch=$((patch + 1))
    new_v="${major}.${minor}.${patch}"
  done

  log "Auto-bumping patch version (+0.0.1): ${current_v} -> ${new_v}"

  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('${pkg_file}', 'utf8'));
    pkg.version = '${new_v}';
    fs.writeFileSync('${pkg_file}', JSON.stringify(pkg, null, 2) + '\n');
  "

  git -C "${K8S_DIR}/.." add "${pkg_file}" >/dev/null 2>&1
  git -C "${K8S_DIR}/.." commit -m "chore(release): bump patch version to ${new_v}" >/dev/null 2>&1 || true
  git -C "${K8S_DIR}/.." push origin HEAD >/dev/null 2>&1 || true
  echo "${new_v}"
}

# Build + push image with multiple tags.
# Args: tag1 tag2 ...
build_and_push() {
  local tags=("$@")
  local build_args=()
  for t in "${tags[@]}"; do
    build_args+=( -t "${REGISTRY}:${t}" )
  done
  log "Building ${tags[*]}"
  docker build --pull "${build_args[@]}" "${K8S_DIR}/.."
  for t in "${tags[@]}"; do
    docker push "${REGISTRY}:${t}" >/dev/null
    ok "pushed :${t}"
  done
}

# Re-tag an existing image in the registry without rebuilding.
# Uses docker manifest inspect + a registry v2 PUT — works for anonymous-read registries.
retag() {
  local src="$1" dst="$2"
  log "Retagging :${src} -> :${dst}"
  # Pull, re-tag locally, push. Bulletproof across registry auth configs.
  docker pull "${REGISTRY}:${src}" >/dev/null
  docker tag  "${REGISTRY}:${src}" "${REGISTRY}:${dst}"
  docker push "${REGISTRY}:${dst}" >/dev/null
  ok "retagged :${dst} -> contents of :${src}"
}

restart_rollout() {
  local deploy="$1"
  log "Rolling out ${deploy}"
  kubectl -n "${NAMESPACE}" rollout restart deployment/"${deploy}"
  kubectl -n "${NAMESPACE}" rollout status  deployment/"${deploy}" --timeout=120s
  ok "${deploy} rolled out"
}

# --- commands ----------------------------------------------------------------

cmd_testing() {
  local new_v; new_v="$(bump_patch_version)"
  local sha; sha="$(short_sha)"
  local branch; branch="$(git -C "${K8S_DIR}/.." rev-parse --abbrev-ref HEAD)"
  local slug;  slug="$(printf '%s' "${branch}" | tr -c 'a-zA-Z0-9._-' '-' | sed 's/--*/-/g; s/^-//; s/-$//')"
  log "Deploy to TESTING (version=v${new_v}, branch=${branch}, sha=${sha})"
  build_and_push "testing" "sha-${sha}" "branch-${slug}" "v${new_v}"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/certificate-testing.yaml"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/deployment-testing.yaml"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/service-testing.yaml"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/ingress-testing.yaml"
  restart_rollout "aac-board-testing"
  echo
  ok "Testing live at https://aac-testing.nexvision.cc  (version v${new_v}, image :sha-${sha})"
}

cmd_prod() {
  local new_v; new_v="$(bump_patch_version)"
  local sha; sha="$(short_sha)"
  local version="v${new_v}"

  log "PROD RELEASE  sha=${sha}  version=${version}"
  build_and_push "stable" "sha-${sha}" "${version}"

  # Git tag the release. Annotated tags carry metadata; push to origin.
  git -C "${K8S_DIR}/.." tag -a "${version}" "${sha}" -m "Release ${version} (prod)"
  git -C "${K8S_DIR}/.." push origin "${version}" 2>/dev/null || \
    log "warning: could not push tag ${version} to origin (continuing)"

  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/certificate.yaml"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/deployment.yaml"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/service.yaml"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/ingress.yaml"
  restart_rollout "aac-board"
  echo
  ok "Prod live at https://aac.nexvision.cc  (image :${version})"
  log "To roll back: ./scripts/deploy.sh rollback ${version}"
}

cmd_rollback() {
  local target="${1:-}"
  [[ -n "${target}" ]] || die "usage: deploy.sh rollback <vX.Y.Z|sha-xxxxxx>"
  [[ "${target}" =~ ^(v|sha-) ]] || target="v${target}"

  log "ROLLBACK prod -> :${target}"
  docker manifest inspect "${REGISTRY}:${target}" >/dev/null \
    || die "Image :${target} not found in registry"

  retag "${target}" "stable"
  kubectl -n "${NAMESPACE}" apply -f "${K8S_DIR}/deployment.yaml"
  restart_rollout "aac-board"
  echo
  ok "Prod rolled back to :${target}"
}

cmd_status() {
  local cur_testing cur_prod
  cur_testing=$(kubectl -n "${NAMESPACE}" get deploy aac-board-testing \
    -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "n/a")
  cur_prod=$(kubectl -n "${NAMESPACE}" get deploy aac-board \
    -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "n/a")
  local latest; latest=$(git -C "${K8S_DIR}/.." log -1 --format='%h %s (%cr)')
  local last_tag; last_tag=$(git -C "${K8S_DIR}/.." tag -l --sort=-v:refname | head -1)
  [[ -z "${last_tag}" ]] && last_tag="(none)"

  cat <<EOF
AAC environments
----------------
  testing : ${cur_testing}
  prod    : ${cur_prod}
  HEAD    : ${latest}
  last tag: ${last_tag}

Recent releases:
$(git -C "${K8S_DIR}/.." tag -l --sort=-v:refname | head -5 | sed 's/^/  - /')
EOF
}

# --- dispatch ----------------------------------------------------------------
case "${1:-}" in
  testing)  cmd_testing ;;
  prod)     shift; cmd_prod "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  status)   cmd_status ;;
  *)
    cat <<'EOF'
Usage: deploy.sh <command> [args]

  testing                  Build HEAD, push :testing + :sha-<short> + :branch-<slug>,
                           deploy to aac-testing.nexvision.cc   (mirrors CI on feature push)
  prod [vX.Y.Z]            Build HEAD, tag :stable + :vX.Y.Z, git-tag, deploy to
                           aac.nexvision.cc                     (mirrors CI on main merge)
  rollback <vX.Y.Z|sha-x>  Repoint prod at a previously-tagged image and roll out
  status                   Show current testing/prod versions + recent tags
EOF
    exit 1 ;;
esac
