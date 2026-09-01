#!/usr/bin/env bash
# Manual verification script for Phase 8 — Statistics.
# Run with the server running and a real MongoDB connection configured.
#
# Usage: bash scripts/test-statistics-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="stats_test_$(date +%s)@example.com"
USERNAME="statstester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Stats Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Get statistics with ZERO activities — should show empty/zeroed structure, not error ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/statistics"
echo -e "\n"

echo "=== 3. Create three activities with known, distinct values ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Small Hike","type":"hiking","date":"2025-06-01","trail":{"distanceKm":10,"durationMinutes":120,"elevationGainM":400,"maxAltitudeM":900,"difficulty":"moderate"},"review":{"rating":7},"location":{"wilaya":"Oran"}}' > /dev/null

curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Big Trek","type":"trekking","date":"2026-08-24","trail":{"distanceKm":18.4,"durationMinutes":260,"elevationGainM":640,"maxAltitudeM":1230,"difficulty":"hard"},"review":{"rating":9},"location":{"wilaya":"Oran"}}' > /dev/null

curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Quiet Camp","type":"camping","date":"2026-08-25","location":{"wilaya":"Tlemcen"}}' > /dev/null

echo "Created 3 activities: Small Hike (Oran, 2025), Big Trek (Oran, 2026), Quiet Camp (Tlemcen, 2026, minimal fields)"
echo -e "\n"

echo "=== 4. Get statistics — verify against expected values below ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/statistics"
echo -e "\n"
echo "EXPECTED:"
echo "  totals: activities=3, distanceKm=28.4, durationMinutes=380, elevationGainM=1040"
echo "  records: highestAltitudeM=1230 (Big Trek), longestDistanceKm=18.4 (Big Trek),"
echo "           hardestDifficulty=hard (Big Trek), highestRating=9 (Big Trek)"
echo "  breakdowns.byType: hiking=1, trekking=1, camping=1"
echo "  breakdowns.byYear: 2026=2, 2025=1"
echo "  breakdowns.byWilaya: Oran=2, Tlemcen=1"
echo "  (Quiet Camp correctly contributes to totals.activities and byType/byWilaya/byYear"
echo "   but does NOT break any record calculation despite having no trail/review data)"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Compare the actual response above against the EXPECTED values. ==="
