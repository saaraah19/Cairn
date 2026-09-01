#!/usr/bin/env bash
# Manual verification script for Phase 7 — Destinations, including the
# upgraded destinationId ownership checks on Activities and Planned Activities.
# Run with the server running and a real MongoDB connection configured.
#
# Usage: bash scripts/test-destination-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="dest_test_$(date +%s)@example.com"
USERNAME="desttester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dest Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create a destination (no plan or activity yet — must work standalone) ==="
DEST_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/destinations" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sahara","location":{"wilaya":"Tamanrasset"},"status":"wishlist"}')
echo "$DEST_RESPONSE"
DEST_ID=$(echo "$DEST_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 3. List destinations, filter status=wishlist ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/destinations?status=wishlist"
echo -e "\n"

echo "=== 4. Create an Activity referencing this destination ==="
ACTIVITY_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Sahara Trek\",\"date\":\"2026-10-01\",\"destinationId\":\"$DEST_ID\"}")
echo "$ACTIVITY_RESPONSE"
echo -e "\n"

echo "=== 5. Create a PlannedActivity referencing the SAME destination ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Return trip\",\"plannedDate\":\"2027-01-01\",\"destinationId\":\"$DEST_ID\"}"
echo -e "\n"

echo "=== 6. Get the destination's 'related' — should show BOTH the activity and the plan ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/destinations/$DEST_ID/related"
echo -e "\n"

echo "=== 7. Attempt to attach someone else's destination to a new activity (should be rejected, 403) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Should fail","date":"2026-10-02","destinationId":"507f1f77bcf86cd799439011"}'
echo -e "\n"

echo "=== 8. Attempt to attach someone else's destination to a new PLANNED activity (should be rejected, 403) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Should fail","plannedDate":"2026-10-02","destinationId":"507f1f77bcf86cd799439011"}'
echo -e "\n"

echo "=== 9. Delete the destination ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/destinations/$DEST_ID"
echo -e "\n"

echo "=== 10. Confirm the Activity from step 4 still exists (destinationId now points at nothing, by design) ==="
ACTIVITY_ID=$(echo "$ACTIVITY_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 6 shows both the activity and plan, step 7-8 both correctly"
echo "reject a cross-user destination (this is the ownership-check upgrade from Phase 3/5's format-only"
echo "placeholder), and step 10 confirms deleting a destination doesn't cascade-delete the activity"
echo "that referenced it. ==="
