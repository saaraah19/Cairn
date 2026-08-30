#!/usr/bin/env bash
# Manual verification script for Phase 3 — Activities (backend).
# Run this with the server running (npm run dev) and a real MongoDB
# connection configured. Requires being logged in first — this script logs
# in a test user before exercising the activity endpoints.
#
# Usage: bash scripts/test-activity-flow.sh
# (Run scripts/test-auth-flow.sh first, or use its same test account, if
# you want a clean account — this script creates its own.)

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="activity_test_$(date +%s)@example.com"
USERNAME="activitytester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Activity Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create a group ==="
GROUP_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/groups" \
  -H "Content-Type: application/json" -d '{"name":"JJ"}')
echo "$GROUP_RESPONSE"
GROUP_ID=$(echo "$GROUP_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 3. Create a full activity (quick + detailed fields mixed) ==="
ACTIVITY_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Cap Blanc Hike\",\"type\":\"hiking\",\"date\":\"2026-08-24\",\"location\":{\"placeName\":\"Cap Blanc\",\"wilaya\":\"Oran\"},\"trail\":{\"distanceKm\":12.4,\"durationMinutes\":260,\"elevationGainM\":640,\"difficulty\":\"moderate\"},\"social\":{\"groupId\":\"$GROUP_ID\",\"companions\":[\"Amel\",\"Yasmine\"]},\"review\":{\"rating\":8,\"notes\":\"Great views.\"},\"visibility\":\"private\"}")
echo "$ACTIVITY_RESPONSE"
ACTIVITY_ID=$(echo "$ACTIVITY_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 4. Create a minimal (quick-log) activity — only name/date required ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Quick evening walk","date":"2026-08-25"}'
echo -e "\n"

echo "=== 5. List activities — should show 2, newest first ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities"
echo -e "\n"

echo "=== 6. Get activity by ID — group name should be populated ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

echo "=== 7. Update activity (partial — only distance) ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/activities/$ACTIVITY_ID" \
  -H "Content-Type: application/json" \
  -d '{"trail":{"distanceKm":13.1}}'
echo -e "\n"
echo "    (confirm difficulty/elevationGainM from step 3 are still present — partial update should not wipe siblings)"
echo -e "\n"

echo "=== 8. Attempt to attach someone else's group ID (should be rejected, 403) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Should fail","date":"2026-08-26","social":{"groupId":"507f1f77bcf86cd799439011"}}'
echo -e "\n"

echo "=== 9. Delete the activity ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

echo "=== 10. Get deleted activity — should 404 ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

echo "=== 11. Create another activity — activityNumber should be 3 (not reused from the deleted one) ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" -d '{"name":"Third activity","date":"2026-08-27"}'
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Check each step above, especially: step 3 group name, step 7 sibling-field preservation, step 8 rejection, step 10 404, step 11 activityNumber. ==="
