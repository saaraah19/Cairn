#!/usr/bin/env bash
# Manual verification script for Phase 6 — Pack My Bag.
# Run with the server running and a real MongoDB connection configured.
#
# Usage: bash scripts/test-pack-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="pack_test_$(date +%s)@example.com"
USERNAME="packtester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Pack Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create two gear items with known weights ==="
GEAR1=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" \
  -H "Content-Type: application/json" -d '{"name":"Tent","category":"shelter","weightGrams":1800}')
GEAR1_ID=$(echo "$GEAR1" | grep -oP '"_id":"\K[^"]+' | head -1)
GEAR2=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" \
  -H "Content-Type: application/json" -d '{"name":"Sleeping Bag","category":"sleeping","weightGrams":900}')
GEAR2_ID=$(echo "$GEAR2" | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Gear created: Tent (1800g), Sleeping Bag (900g)"
echo -e "\n"

echo "=== 3. Create a planned activity ==="
PLAN_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" -d '{"name":"Camping Trip","type":"camping","plannedDate":"2026-11-01"}')
PLAN_ID=$(echo "$PLAN_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo "$PLAN_RESPONSE"
echo -e "\n"

echo "=== 4. Pack the bag with both gear items ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/planned-activities/$PLAN_ID" \
  -H "Content-Type: application/json" -d "{\"packedGearItemIds\":[\"$GEAR1_ID\",\"$GEAR2_ID\"]}"
echo -e "\n"

echo "=== 5. Get the plan — packedGearItemIds should be populated with name/weightGrams ==="
echo "    (expected total weight: 1800 + 900 = 2700g)"
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/planned-activities/$PLAN_ID"
echo -e "\n"

echo "=== 6. Attempt to pack someone else's gear (should be rejected, 403) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/planned-activities/$PLAN_ID" \
  -H "Content-Type: application/json" -d '{"packedGearItemIds":["507f1f77bcf86cd799439011"]}'
echo -e "\n"

echo "=== 7. Unpack one item (send only gear 1) ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/planned-activities/$PLAN_ID" \
  -H "Content-Type: application/json" -d "{\"packedGearItemIds\":[\"$GEAR1_ID\"]}"
echo -e "\n"

echo "=== 8. Confirm only Tent remains packed ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/planned-activities/$PLAN_ID"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 5 shows both items with correct weights (sum = 2700g in the UI),"
echo "step 6 rejection, and step 7-8 confirm the packed list correctly narrows to just one item. ==="
