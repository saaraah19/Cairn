#!/usr/bin/env bash
# M5 — Kudos. Covers docs/08_COMMUNITY_PROPOSAL.md §13 M5:
#   - kudos on a private activity is rejected
#   - self-kudos is rejected
#   - duplicate kudos is a no-op
#   - unauthorized (anonymous) kudos is rejected
#   - remove is idempotent
#
# Usage: bash scripts/test-community-kudos.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
OWNER_JAR=$(mktemp)
GIVER_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register an owner and a separate giver ==="
curl -s -c "$OWNER_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Kudos Owner\",\"email\":\"kudosowner_$TS@example.com\",\"username\":\"kudosowner$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$GIVER_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Kudos Giver\",\"email\":\"kudosgiver_$TS@example.com\",\"username\":\"kudosgiver$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered both."
echo -e "\n"

echo "=== 1. Owner creates a PUBLIC and a PRIVATE activity ==="
PUBLIC_RESPONSE=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Kudos Test Hike","date":"2026-07-01","type":"hiking","visibility":"public"}')
PUBLIC_ID=$(echo "$PUBLIC_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
PRIVATE_RESPONSE=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Kudos Private Hike","date":"2026-07-02","type":"hiking"}')
PRIVATE_ID=$(echo "$PRIVATE_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Public: $PUBLIC_ID, Private: $PRIVATE_ID"
echo -e "\n"

echo "=== 2. Anonymous kudos attempt — expect 401 ==="
curl -s -w " [HTTP %{http_code}]" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/kudos"
echo -e "\n"

echo "=== 3. Owner tries to kudos their own activity — expect 422 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/kudos"
echo -e "\n"

echo "=== 4. Kudos on the PRIVATE activity (as the giver) — expect 404 ==="
curl -s -w " [HTTP %{http_code}]" -b "$GIVER_JAR" -X POST "$BASE_URL/api/community/activities/$PRIVATE_ID/kudos"
echo -e "\n"

echo "=== 5. Giver kudos the public activity — expect 200, kudosCount: 1 ==="
curl -s -w " [HTTP %{http_code}]" -b "$GIVER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/kudos"
echo -e "\n"

echo "=== 6. Same giver kudos again (duplicate) — expect kudosCount still 1, not 2 ==="
curl -s -w " [HTTP %{http_code}]" -b "$GIVER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/kudos"
echo -e "\n"

echo "=== 7. GET the public activity — hasKudos should be true for the giver, kudosCount should be 1 ==="
curl -s -b "$GIVER_JAR" "$BASE_URL/api/community/activities/$PUBLIC_ID" | grep -o '"kudosCount":[0-9]*'
curl -s -b "$GIVER_JAR" "$BASE_URL/api/community/activities/$PUBLIC_ID" | grep -o '"hasKudos":[a-z]*'
echo -e "\n"

echo "=== 8. Giver removes kudos — expect kudosCount: 0 ==="
curl -s -w " [HTTP %{http_code}]" -b "$GIVER_JAR" -X DELETE "$BASE_URL/api/community/activities/$PUBLIC_ID/kudos"
echo -e "\n"

echo "=== 9. Remove again (already removed) — expect a clean no-op, still kudosCount: 0, not an error ==="
curl -s -w " [HTTP %{http_code}]" -b "$GIVER_JAR" -X DELETE "$BASE_URL/api/community/activities/$PUBLIC_ID/kudos"
echo -e "\n"

rm -f "$OWNER_JAR" "$GIVER_JAR"
echo "=== Done. Step 2 -> 401. Step 3 -> 422. Step 4 -> 404. Steps 5,6 -> 200 with kudosCount 1 both times. Step 7 -> kudosCount 1, hasKudos true. Steps 8,9 -> 200 with kudosCount 0 both times. ==="
