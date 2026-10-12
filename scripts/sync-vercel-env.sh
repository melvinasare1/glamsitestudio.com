#!/usr/bin/env bash
# Sync local .env.local values to the Vercel `glamsitestudio` project.
# Usage: ./scripts/sync-vercel-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCOPE=(--scope melvinasare1s-projects --project glamsitestudio --yes --non-interactive)

# shellcheck disable=SC1091
source_env() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

source_env "$ROOT/apps/dashboard/.env.local"
source_env "$ROOT/apps/web/.env.local"
source_env "$ROOT/.env.local"

: "${NEXT_PUBLIC_SUPABASE_URL:?Missing NEXT_PUBLIC_SUPABASE_URL in .env.local}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?Missing NEXT_PUBLIC_SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Missing SUPABASE_SERVICE_ROLE_KEY}"
: "${SUPABASE_PUBLISHABLE_KEY:?Missing SUPABASE_PUBLISHABLE_KEY}"

vercel_cmd() {
  npx vercel "$@"
}

vercel_cmd link "${SCOPE[@]}" >/dev/null 2>&1 || true

set_env() {
  local name="$1"
  local value="$2"
  local sensitive="${3:-0}"
  shift 3
  local extra=()
  if [[ "$sensitive" == "1" ]]; then extra+=(--sensitive); fi
  for env in "$@"; do
    echo "→ $name ($env)"
    vercel_cmd env add "$name" "$env" "${SCOPE[@]}" --force --value "$value" "${extra[@]}"
  done
}

# Supabase (all environments)
set_env NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL" 0 production preview development
set_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY" 0 production preview development
set_env SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" 1 production preview development
set_env SUPABASE_PUBLISHABLE_KEY "$SUPABASE_PUBLISHABLE_KEY" 0 production preview development

# Cross-app URLs
set_env NEXT_PUBLIC_WEB_URL "https://www.glamsitestudio.com" 0 production preview
set_env NEXT_PUBLIC_DASHBOARD_URL "https://dashboard.glamsitestudio.com" 0 production preview
set_env NEXT_PUBLIC_WEB_URL "http://localhost:3000" 0 development
set_env NEXT_PUBLIC_DASHBOARD_URL "http://localhost:3001" 0 development

# Optional — set when present locally
if [[ -n "${NEXT_PUBLIC_NAMECHEAP_AFFILIATE_URL:-}" ]]; then
  set_env NEXT_PUBLIC_NAMECHEAP_AFFILIATE_URL "$NEXT_PUBLIC_NAMECHEAP_AFFILIATE_URL" 0 production preview development
fi
if [[ -n "${ANSAA_MOMO_NUMBER:-}" ]]; then
  set_env ANSAA_MOMO_NUMBER "$ANSAA_MOMO_NUMBER" 0 production preview development
fi
if [[ -n "${ANSAA_MOMO_ACCOUNT_NAME:-}" ]]; then
  set_env ANSAA_MOMO_ACCOUNT_NAME "$ANSAA_MOMO_ACCOUNT_NAME" 0 production preview development
fi
if [[ -n "${RESEND_API_KEY:-}" ]]; then
  set_env RESEND_API_KEY "$RESEND_API_KEY" 1 production preview development
fi
if [[ -n "${RESEND_FROM_EMAIL:-}" ]]; then
  set_env RESEND_FROM_EMAIL "$RESEND_FROM_EMAIL" 0 production preview development
fi
if [[ -n "${SUPPORT_INBOX_EMAIL:-}" ]]; then
  set_env SUPPORT_INBOX_EMAIL "$SUPPORT_INBOX_EMAIL" 0 production preview development
fi
if [[ -n "${ADMIN_EMAILS:-}" ]]; then
  set_env ADMIN_EMAILS "$ADMIN_EMAILS" 0 production preview development
fi

echo ""
echo "Production env on Vercel (glamsitestudio):"
vercel_cmd env ls production "${SCOPE[@]}"
