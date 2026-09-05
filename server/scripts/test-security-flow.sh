#!/usr/bin/env bash
# Consolidated cross-user security test — the specific tests explicitly
# mandated by docs/02_TECHNICAL_ARCHITECTURE.md §52:
#   - User A cannot retrieve User B's private resources
#   - User A cannot modify User B's resources
#   - User A cannot delete User B's resources
#   - A client-supplied ownership ID is ignored/rejected, never trusted
#
# Individual phases tested pieces of this already (e.g. "can't attach
# someone else's group to an activity"), but this is the first single pass
# covering every resource type end to end. Run before deploying.
#
# Usage: bash scripts/test-security-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
JAR_A=$(mktemp)
JAR_B=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register User A and User B ==="
curl -s -c "$JAR_A" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"User A\",\"email\":\"usera_$TS@example.com\",\"username\":\"usera$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$JAR_B" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"User B\",\"email\":\"userb_$TS@example.com\",\"username\":\"userb$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered."
echo -e "\n"

echo "=== User A creates one of each resource type ==="
ACTIVITY_ID=$(curl -s -b "$JAR_A" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" -d '{"name":"A private hike","date":"2026-09-01","visibility":"private"}' \
  | grep -oP '"_id":"\K[^"]+' | head -1)
GEAR_ID=$(curl -s -b "$JAR_A" -X POST "$BASE_URL/api/gear" \
  -H "Content-Type: application/json" -d '{"name":"A private boots"}' | grep -oP '"_id":"\K[^"]+' | head -1)
PLAN_ID=$(curl -s -b "$JAR_A" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" -d '{"name":"A private plan","plannedDate":"2026-10-01"}' \
  | grep -oP '"_id":"\K[^"]+' | head -1)
DEST_ID=$(curl -s -b "$JAR_A" -X POST "$BASE_URL/api/destinations" \
  -H "Content-Type: application/json" -d '{"name":"A private destination"}' | grep -oP '"_id":"\K[^"]+' | head -1)
GROUP_ID=$(curl -s -b "$JAR_A" -X POST "$BASE_URL/api/groups" \
  -H "Content-Type: application/json" -d '{"name":"A private group"}' | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Created: activity=$ACTIVITY_ID gear=$GEAR_ID plan=$PLAN_ID destination=$DEST_ID group=$GROUP_ID"
echo -e "\n"

FAIL=0
check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  OK   $label (got $actual)"
  else
    echo "  FAIL $label (expected $expected, got $actual)"
    FAIL=1
  fi
}

echo "=== User B attempts to READ User A's resources (expect 404 — never leak existence) ==="
check "GET activity"    404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" "$BASE_URL/api/activities/$ACTIVITY_ID")"
check "GET gear"        404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" "$BASE_URL/api/gear/$GEAR_ID")"
check "GET plan"        404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" "$BASE_URL/api/planned-activities/$PLAN_ID")"
check "GET destination" 404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" "$BASE_URL/api/destinations/$DEST_ID")"
echo -e "\n"

echo "=== User B attempts to MODIFY User A's resources (expect 404) ==="
check "PATCH activity"    404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X PATCH "$BASE_URL/api/activities/$ACTIVITY_ID" -H "Content-Type: application/json" -d '{"name":"Hijacked"}')"
check "PATCH gear"        404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X PATCH "$BASE_URL/api/gear/$GEAR_ID" -H "Content-Type: application/json" -d '{"name":"Hijacked"}')"
check "PATCH plan"        404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X PATCH "$BASE_URL/api/planned-activities/$PLAN_ID" -H "Content-Type: application/json" -d '{"name":"Hijacked"}')"
check "PATCH destination" 404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X PATCH "$BASE_URL/api/destinations/$DEST_ID" -H "Content-Type: application/json" -d '{"name":"Hijacked"}')"
echo -e "\n"

echo "=== User B attempts to DELETE User A's resources (expect 404) ==="
check "DELETE activity"    404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X DELETE "$BASE_URL/api/activities/$ACTIVITY_ID")"
check "DELETE gear"        404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X DELETE "$BASE_URL/api/gear/$GEAR_ID")"
check "DELETE plan"        404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X DELETE "$BASE_URL/api/planned-activities/$PLAN_ID")"
check "DELETE destination" 404 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X DELETE "$BASE_URL/api/destinations/$DEST_ID")"
echo -e "\n"

echo "=== User B attempts to attach User A's resources to their OWN new activity (expect 403 — ownership never trusted from client) ==="
check "attach A's group" 403 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" -d "{\"name\":\"x\",\"date\":\"2026-09-01\",\"social\":{\"groupId\":\"$GROUP_ID\"}}")"
check "attach A's gear"  403 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" -d "{\"name\":\"x\",\"date\":\"2026-09-01\",\"gearItemIds\":[\"$GEAR_ID\"]}")"
check "attach A's dest"  403 "$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" -d "{\"name\":\"x\",\"date\":\"2026-09-01\",\"destinationId\":\"$DEST_ID\"}")"
echo -e "\n"

echo "=== User B attempts to list activities — must see ONLY their own (zero results) ==="
B_COUNT=$(curl -s -b "$JAR_B" "$BASE_URL/api/activities" | grep -o '"_id"' | wc -l)
check "User B's activity list is empty" 0 "$B_COUNT"
echo -e "\n"

echo "=== User B supplies User A's user ID as a client-side field (should be ignored, not trusted) ==="
FORGED=$(curl -s -b "$JAR_B" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" -d "{\"name\":\"forged\",\"date\":\"2026-09-01\",\"userId\":\"000000000000000000000000\"}")
FORGED_ID=$(echo "$FORGED" | grep -oP '"_id":"\K[^"]+' | head -1)
# If it belonged to the forged userId instead of B, B wouldn't be able to see it in their own list.
CAN_SEE=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR_B" "$BASE_URL/api/activities/$FORGED_ID")
check "forged userId ignored (B still owns it)" 200 "$CAN_SEE"
echo -e "\n"

rm -f "$JAR_A" "$JAR_B"
if [ "$FAIL" = "0" ]; then
  echo "=== ALL SECURITY CHECKS PASSED ==="
else
  echo "=== ONE OR MORE SECURITY CHECKS FAILED — see FAIL lines above. Do not deploy until resolved. ==="
  exit 1
fi
