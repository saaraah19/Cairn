#!/usr/bin/env bash
# Manual verification script for Phase 4 — Gear (backend, including
# Activity <-> Gear wiring). Run with the server running and a real
# MongoDB connection configured.
#
# Usage: bash scripts/test-gear-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="gear_test_$(date +%s)@example.com"
USERNAME="geartester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Gear Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create two similar-but-distinct gear items (same brand/name pattern) ==="
GEAR1_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" \
  -H "Content-Type: application/json" \
  -d '{"name":"Trail Shoes","category":"footwear","brand":"Salomon","weightGrams":720,"condition":"good"}')
echo "$GEAR1_RESPONSE"
GEAR1_ID=$(echo "$GEAR1_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)

GEAR2_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" \
  -H "Content-Type: application/json" \
  -d '{"name":"Old Trail Shoes","category":"footwear","brand":"Salomon","weightGrams":740,"condition":"worn"}')
echo "$GEAR2_RESPONSE"
GEAR2_ID=$(echo "$GEAR2_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n(confirm these are two SEPARATE gear items, not merged/deduplicated)\n"

echo "=== 3. List gear, filter by category=footwear ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear?category=footwear"
echo -e "\n"

echo "=== 4. Create Activity #1 using gear item 1 ==="
ACTIVITY1=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Hike A\",\"date\":\"2026-08-20\",\"gearItemIds\":[\"$GEAR1_ID\"]}")
echo "$ACTIVITY1"
echo -e "\n"

echo "=== 5. Create Activity #2 using the SAME gear item 1 ==="
ACTIVITY2=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Hike B\",\"date\":\"2026-08-25\",\"gearItemIds\":[\"$GEAR1_ID\"]}")
echo "$ACTIVITY2"
ACTIVITY2_ID=$(echo "$ACTIVITY2" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 6. Get gear item 1's usage history — should show BOTH activities ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear/$GEAR1_ID/usage"
echo -e "\n"

echo "=== 7. Get gear item 2's usage history — should be EMPTY (never used) ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear/$GEAR2_ID/usage"
echo -e "\n"

echo "=== 8. Get Activity #2 — gearItemIds should be populated with gear 1's name/category ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY2_ID"
echo -e "\n"

echo "=== 9. Attempt to attach someone else's gear ID to a new activity (should be rejected, 403) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Should fail","date":"2026-08-26","gearItemIds":["507f1f77bcf86cd799439011"]}'
echo -e "\n"

echo "=== 10. Delete gear item 1 (still referenced by 2 activities) ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/gear/$GEAR1_ID"
echo -e "\n"

echo "=== 11. Get Activity #2 again — gearItemIds should now be empty (dangling reference cleaned up) ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY2_ID"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 2 gear items stayed separate (not merged), step 6 shows 2"
echo "activities, step 9 rejection, and step 11 confirms the dangling gearItemIds reference was"
echo "cleaned up automatically after deleting gear item 1. ==="
