#!/usr/bin/env bash
# M2 — Public Activity View. Covers exactly the tests the proposal calls
# for at this milestone (docs/08_COMMUNITY_PROPOSAL.md §13, M2):
#   - a public activity is retrievable anonymously via the community endpoint
#   - a private activity is NOT retrievable via the community endpoint,
#     even by its own owner (this endpoint is public-only — the owner has
#     /api/activities/:id for their own data, this is not a shortcut around
#     that)
#   - a public → private flip is respected immediately, no caching
#   - the response never contains fields that are never public
#
# Usage: bash scripts/test-community-public-activity.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register a user ==="
curl -s -c "$JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Community Tester\",\"email\":\"community_$TS@example.com\",\"username\":\"communitytester$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered."
echo -e "\n"

echo "=== 1. Create a PUBLIC activity with every private field populated ==="
PUBLIC_RESPONSE=$(curl -s -b "$JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Public Test Hike",
    "date":"2026-09-01",
    "type":"hiking",
    "location":{"placeName":"Cap Blanc","wilaya":"Oran","country":"Algeria","latitude":35.7331111,"longitude":-0.7869999},
    "social":{"companions":["SecretFriendName"]},
    "costDzd":5000,
    "review":{"notes":"PRIVATE_NOTES_TEXT","challenges":"Steep climb","rating":8},
    "publicCaption":"A great public hike.",
    "visibility":"public"
  }')
echo "$PUBLIC_RESPONSE"
PUBLIC_ID=$(echo "$PUBLIC_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 2. Create a PRIVATE activity (default visibility) ==="
PRIVATE_RESPONSE=$(curl -s -b "$JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Private Test Hike","date":"2026-09-02","type":"hiking"}')
echo "$PRIVATE_RESPONSE"
PRIVATE_ID=$(echo "$PRIVATE_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 3. GET the public activity ANONYMOUSLY (no cookie) — expect 200, check for leaked fields ==="
ANON_RESPONSE=$(curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/activities/$PUBLIC_ID")
echo "$ANON_RESPONSE"
echo "$ANON_RESPONSE" | grep -q "PRIVATE_NOTES_TEXT" && echo "!!! LEAK: review.notes appeared !!!" || echo "OK: review.notes not present"
echo "$ANON_RESPONSE" | grep -q "SecretFriendName" && echo "!!! LEAK: companion name appeared !!!" || echo "OK: companion name not present"
echo "$ANON_RESPONSE" | grep -q "5000" && echo "!!! LEAK: costDzd appeared !!!" || echo "OK: costDzd not present"
echo "$ANON_RESPONSE" | grep -q "35.7331111" && echo "!!! LEAK: exact latitude appeared !!!" || echo "OK: exact latitude not present"
echo -e "\n"

echo "=== 4. GET the private activity ANONYMOUSLY via the community endpoint — expect 404 ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/activities/$PRIVATE_ID"
echo -e "\n"

echo "=== 5. GET the private activity via the community endpoint AS ITS OWNER — still expect 404 ==="
echo "    (This endpoint is public-only. The owner has /api/activities/:id for their own private data;"
echo "     this checks that optionalAuthenticate does not grant owner access through the public route.)"
curl -s -w " [HTTP %{http_code}]" -b "$JAR" "$BASE_URL/api/community/activities/$PRIVATE_ID"
echo -e "\n"

echo "=== 6. Flip the public activity to private via the normal (authenticated) endpoint ==="
curl -s -b "$JAR" -X PATCH "$BASE_URL/api/activities/$PUBLIC_ID" \
  -H "Content-Type: application/json" \
  -d '{"visibility":"private"}' > /dev/null
echo "Flipped."
echo -e "\n"

echo "=== 7. GET it again via the community endpoint — expect 404 immediately, no caching ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/activities/$PUBLIC_ID"
echo -e "\n"

rm -f "$JAR"
echo "=== Done. Step 3 must show HTTP 200 with no leak lines; steps 4, 5, and 7 must all show HTTP 404. ==="
