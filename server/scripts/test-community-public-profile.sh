#!/usr/bin/env bash
# M3 — Public Profiles. Covers docs/08_COMMUNITY_PROPOSAL.md §13 M3:
#   - a non-opted-in user's profile is NOT retrievable (404)
#   - opting in via PATCH /api/profile makes it retrievable
#   - statistics reflect only public activities, not real totals
#   - private fields (email, preferences) never appear
#
# Usage: bash scripts/test-community-public-profile.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
JAR=$(mktemp)
TS=$(date +%s)
USERNAME="communityprofile$TS"

echo "=== Setup: register a user (isPublicProfile defaults to false) ==="
curl -s -c "$JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Profile Tester\",\"email\":\"profile_$TS@example.com\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered as $USERNAME."
echo -e "\n"

echo "=== 1. GET the profile BEFORE opting in — expect 404 ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/users/$USERNAME"
echo -e "\n"

echo "=== 2. Create one PUBLIC activity (8km) and one PRIVATE activity (100km) ==="
curl -s -b "$JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Public Stat Hike","date":"2026-05-01","type":"hiking","trail":{"distanceKm":8},"visibility":"public"}' > /dev/null
curl -s -b "$JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Private Stat Hike","date":"2026-05-02","type":"hiking","trail":{"distanceKm":100}}' > /dev/null
echo "Created."
echo -e "\n"

echo "=== 3. Opt in to a public profile ==="
curl -s -b "$JAR" -X PATCH "$BASE_URL/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"isPublicProfile":true}' > /dev/null
echo "Opted in."
echo -e "\n"

echo "=== 4. GET the profile now — expect 200, distanceKm should be 8, NOT 108 ==="
PROFILE_RESPONSE=$(curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/users/$USERNAME")
echo "$PROFILE_RESPONSE"
echo "$PROFILE_RESPONSE" | grep -q '"distanceKm":108' && echo "!!! LEAK: private activity counted in statistics !!!" || echo "OK: totals do not include the private activity's distance"
echo "$PROFILE_RESPONSE" | grep -q "Private Stat Hike" && echo "!!! LEAK: private activity name appeared !!!" || echo "OK: private activity name not present"
echo "$PROFILE_RESPONSE" | grep -qi "profile_$TS@example.com" && echo "!!! LEAK: email appeared !!!" || echo "OK: email not present"
echo -e "\n"

echo "=== 5. Opt back out — expect 404 again immediately ==="
curl -s -b "$JAR" -X PATCH "$BASE_URL/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"isPublicProfile":false}' > /dev/null
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/users/$USERNAME"
echo -e "\n"

rm -f "$JAR"
echo "=== Done. Step 1 and step 5 must show HTTP 404. Step 4 must show HTTP 200 with no leak lines. ==="
