#!/usr/bin/env bash
# Manual verification script for Phase 5 — Planned Activities.
# Run with the server running and a real MongoDB connection configured.
#
# Usage: bash scripts/test-planned-activity-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="plan_test_$(date +%s)@example.com"
USERNAME="plantester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Plan Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create a planned activity ==="
PLAN_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sahara Trek","type":"trekking","plannedDate":"2026-10-15","location":{"placeName":"Sahara"},"expectedDifficulty":"hard"}')
echo "$PLAN_RESPONSE"
PLAN_ID=$(echo "$PLAN_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 3. List planned activities, filter status=planned ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/planned-activities?status=planned"
echo -e "\n"

echo "=== 4. Create the actual Activity (simulating 'Log this activity') ==="
ACTIVITY_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sahara Trek","type":"trekking","date":"2026-10-16","trail":{"distanceKm":22.5}}')
echo "$ACTIVITY_RESPONSE"
ACTIVITY_ID=$(echo "$ACTIVITY_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n(note: actual date 10-16 differs from planned 10-15 — this is expected and fine)\n"

echo "=== 5. Complete the plan, linking it to the new activity ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities/$PLAN_ID/complete" \
  -H "Content-Type: application/json" -d "{\"activityId\":\"$ACTIVITY_ID\"}"
echo -e "\n"

echo "=== 6. Get the plan — status should be 'completed', completedActivityId populated ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/planned-activities/$PLAN_ID"
echo -e "\n"

echo "=== 7. Confirm the ORIGINAL plan record still exists with its ORIGINAL plannedDate (not overwritten) ==="
echo "    (check the response above: plannedDate should still be 2026-10-15, not 2026-10-16)"
echo -e "\n"

echo "=== 8. Attempt to complete a plan with someone else's activity ID (should be rejected, 403) ==="
PLAN2_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" -d '{"name":"Another plan","plannedDate":"2026-11-01"}')
PLAN2_ID=$(echo "$PLAN2_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities/$PLAN2_ID/complete" \
  -H "Content-Type: application/json" -d '{"activityId":"507f1f77bcf86cd799439011"}'
echo -e "\n"

echo "=== 9. Delete a plan — the linked Activity should NOT be deleted ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/planned-activities/$PLAN_ID"
echo -e "\n"

echo "=== 10. Confirm the activity from step 4 still exists ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 6-7 the plan is preserved with its original data (not"
echo "overwritten by the activity), step 8 cross-user rejection, and step 9-10 deleting a plan"
echo "does not delete its linked activity. ==="
