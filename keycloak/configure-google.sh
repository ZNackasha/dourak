#!/usr/bin/env bash
#
# Apply the real Google OAuth credentials to the "google" identity provider in
# the local dev Keycloak realm.
#
# Why this exists: Keycloak's realm import does NOT substitute ${env.*}
# placeholders inside identity-provider config, so the realm JSON ships with
# placeholder credentials. This script reads the actual GOOGLE_CLIENT_ID /
# GOOGLE_CLIENT_SECRET from the running Keycloak container's environment (passed
# through from the project .env via docker-compose) and patches the IdP.
#
# Run it after (re)creating the Keycloak container:
#   docker compose up -d --force-recreate keycloak
#   ./keycloak/configure-google.sh
#
# Google Cloud console: add this authorized redirect URI to the same OAuth
# client used for the calendar integration:
#   http://localhost:8080/realms/dourak/broker/google/endpoint
set -euo pipefail

KC_URL="${KC_URL:-http://localhost:8080}"
REALM="${REALM:-dourak}"
CONTAINER="${KC_CONTAINER:-dourak-keycloak}"
ADMIN_USER="${KC_ADMIN_USER:-admin}"
ADMIN_PASS="${KC_ADMIN_PASS:-admin}"

CID="$(docker exec "$CONTAINER" printenv GOOGLE_CLIENT_ID || true)"
CSECRET="$(docker exec "$CONTAINER" printenv GOOGLE_CLIENT_SECRET || true)"

if [ -z "$CID" ] || [ -z "$CSECRET" ]; then
  echo "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set in the $CONTAINER container." >&2
  echo "Add them to .env and recreate: docker compose up -d --force-recreate keycloak" >&2
  exit 1
fi

TOKEN="$(curl -s \
  -d client_id=admin-cli -d "username=$ADMIN_USER" -d "password=$ADMIN_PASS" \
  -d grant_type=password \
  "$KC_URL/realms/master/protocol/openid-connect/token" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")"

CURRENT="$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$KC_URL/admin/realms/$REALM/identity-provider/instances/google")"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
CID="$CID" CSECRET="$CSECRET" CURRENT="$CURRENT" python3 - "$TMP" <<'PY'
import os, sys, json
d = json.loads(os.environ["CURRENT"])
d.setdefault("config", {})
d["config"]["clientId"] = os.environ["CID"]
d["config"]["clientSecret"] = os.environ["CSECRET"]
with open(sys.argv[1], "w") as f:
    json.dump(d, f)
PY

STATUS="$(curl -s -o /dev/null -w '%{http_code}' -X PUT \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @"$TMP" \
  "$KC_URL/admin/realms/$REALM/identity-provider/instances/google")"

if [ "$STATUS" = "204" ]; then
  echo "Google identity provider configured."
else
  echo "Failed to update Google IdP (HTTP $STATUS)." >&2
  exit 1
fi
