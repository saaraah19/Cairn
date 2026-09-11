#!/usr/bin/env bash
# M4 — Explore Feed. Covers docs/08_COMMUNITY_PROPOSAL.md §13 M4:
#   - private activities never appear in the feed regardless of filters
#   - pagination doesn't skip/duplicate across pages
#
# Usage: bash scripts/test-community-feed.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register a user ==="
curl -s -c "$JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Feed Tester\",\"email\":\"feed_$TS@example.com\",\"username\":\"feedtester$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered."
echo -e "\n"

echo "=== 1. Create 3 PUBLIC activities and 1 PRIVATE activity, all in Oran ==="
for i in 1 2 3; do
  curl -s -b "$JAR" -X POST "$BASE_URL/api/activities" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Feed Public $i\",\"date\":\"2026-06-0$i\",\"type\":\"hiking\",\"location\":{\"wilaya\":\"Oran\"},\"visibility\":\"public\"}" > /dev/null
done
curl -s -b "$JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Feed Private Should Never Appear","date":"2026-06-04","type":"hiking","location":{"wilaya":"Oran"}}' > /dev/null
echo "Created."
echo -e "\n"

echo "=== 2. GET the feed anonymously — expect 200, private activity must not appear ==="
FEED_RESPONSE=$(curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/feed?scope=explore&limit=50")
echo "$FEED_RESPONSE" | grep -q "Feed Private Should Never Appear" && echo "!!! LEAK: private activity appeared in the feed !!!" || echo "OK: private activity not in the feed"
echo -e "\n"

echo "=== 3. Filter by wilaya=Oran — private activity must still never appear ==="
curl -s "$BASE_URL/api/community/feed?scope=explore&wilaya=Oran&limit=50" | grep -q "Feed Private Should Never Appear" \
  && echo "!!! LEAK: private activity appeared via wilaya filter !!!" || echo "OK: private activity not present via wilaya filter"
echo -e "\n"

echo "=== 4. Paginate with limit=2 and follow nextCursor — check for duplicates ==="
PAGE1=$(curl -s "$BASE_URL/api/community/feed?scope=explore&limit=2")
echo "$PAGE1"
NEXT_CURSOR=$(echo "$PAGE1" | grep -oP '"nextCursor":"\K[^"]+' | head -1)
if [ -n "$NEXT_CURSOR" ]; then
  echo "--- page 2 (cursor=$NEXT_CURSOR) ---"
  curl -s "$BASE_URL/api/community/feed?scope=explore&limit=2&cursor=$NEXT_CURSOR"
else
  echo "(no second page — fewer than 3 public activities visible, check manually if unexpected)"
fi
echo -e "\n"

echo "=== 5. scope=following should be rejected (not silently treated as Explore) — expect 400 ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/feed?scope=following"
echo -e "\n"

rm -f "$JAR"
echo "=== Done. Steps 2 and 3 must show no leak line. Step 4's two pages must not share any activity id. Step 5 must show HTTP 400. ==="
