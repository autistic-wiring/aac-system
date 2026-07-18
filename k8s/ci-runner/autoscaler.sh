#!/bin/bash
set -euo pipefail

NAMESPACE="openclaw"
GITHUB_TOKEN="${ACCESS_TOKEN}"

# Org -> deployment config
# Each org lists the k8s deployments to scale and the repos to check for queued jobs.
# Special repo name "__ALL__" means "list all repos in the org automatically."

declare -A ORG_DEPLOYMENTS ORG_MAX_RUNNERS

ORG_DEPLOYMENTS["autistic-wiring"]="github-runner-autistic-wiring"
ORG_MAX_RUNNERS["autistic-wiring"]=1  # single-node cluster; max 1 runner pod fits
ORG_REPOS_autistic_wiring=(aac-system)

ORG_DEPLOYMENTS["nexvisioncc"]="github-runner github-runner-nexvisioncc"
ORG_MAX_RUNNERS["nexvisioncc"]=3
ORG_REPOS_nexvisioncc=(__ALL__)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2; }

# ---------------------------------------------------------------------------
# check_token — validate GitHub PAT before doing anything
# ---------------------------------------------------------------------------
check_token() {
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    "https://api.github.com/user" 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    return 0
  fi
  log "ERROR: GitHub token invalid (HTTP ${status}) — cannot check queued jobs"
  return 1
}

# ---------------------------------------------------------------------------
# get_repos — return list of repos for an org
# ---------------------------------------------------------------------------
get_repos() {
  local org="$1"
  local -n repos_ref="$2"  # bash nameref — list of repo names or special marker
  if [[ "${repos_ref[0]}" == "__ALL__" ]]; then
    curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
      "https://api.github.com/orgs/${org}/repos?per_page=100" 2>/dev/null |
      jq -r '.[].name' 2>/dev/null || echo ""
  else
    printf '%s\n' "${repos_ref[@]}"
  fi
}

# ---------------------------------------------------------------------------
# count_queued — count queued workflow runs across specified repos
# ---------------------------------------------------------------------------
count_queued_jobs() {
  local org="$1"
  local total=0
  local repos
  mapfile -t repos < <(get_repos "$org" "ORG_REPOS_${org//-/_}")

  for repo in "${repos[@]}"; do
    [[ -z "$repo" ]] && continue
    local response http_code run_count
    response=$(curl -s -w '\n%{http_code}' \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${org}/${repo}/actions/runs?status=pending&per_page=100" \
      2>/dev/null || echo -e '{}\n000')
    http_code=$(echo "$response" | tail -1)
    run_count=$(echo "$response" | sed '$d' | jq -r '.total_count // 0' 2>/dev/null || echo "0")

    if [[ "$http_code" != "200" ]]; then
      log "  WARN: ${org}/${repo} HTTP ${http_code}"
      continue
    fi
    if [[ "$run_count" -gt 0 ]]; then
      log "  ${org}/${repo}: ${run_count} pending run(s)"
    fi
    total=$((total + run_count))
  done
  echo "$total"
}

# ---------------------------------------------------------------------------
# scale_deployment
# ---------------------------------------------------------------------------
scale_deployment() {
  local deployment="$1" replicas="$2"
  local current
  current=$(kubectl get deployment "${deployment}" -n "${NAMESPACE}" \
    -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
  if [[ "$current" != "$replicas" ]]; then
    log "Scaling ${deployment} from ${current} → ${replicas}"
    kubectl scale deployment "${deployment}" -n "${NAMESPACE}" --replicas="${replicas}"
  fi
}

# ===========================================================================
log "=== autoscaler start ==="

if ! check_token; then
  exit 1
fi

for org in "${!ORG_DEPLOYMENTS[@]}"; do
  deployments="${ORG_DEPLOYMENTS[$org]}"
  max_runners="${ORG_MAX_RUNNERS[$org]}"

  log "Checking org: ${org}"
  queued=$(count_queued_jobs "$org")
  log "Total queued runs: ${queued}"

  desired=0
  if [[ "$queued" -gt 0 ]]; then
    desired=$((queued > max_runners ? max_runners : queued))
  fi
  log "Desired replicas: ${desired}  (max=${max_runners})"

  for dep in ${deployments}; do
    scale_deployment "$dep" "$desired"
  done
done

log "=== autoscaler done ==="
