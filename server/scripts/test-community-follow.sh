#!/usr/bin/env bash
# M8 — Following. Covers docs/08_COMMUNITY_PROPOSAL.md §6/§13 M8:
#   - cannot follow a non-public-profile user
#   - cannot self-follow
#   - cannot follow twice (idempotent, not an error)
#   - unfollow is idempotent
#   - the Following feed never exposes anything Explore wouldn't also show
#     for the same user, and never shows an unfollowed user's activity
#
# Usage: bash scripts/test-community-follow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
FOLLOWER_JAR=$(mktemp)
PUBLIC_USER_JAR=$(mktemp)
PRIVATE_USER_JAR=$(mktemp)
UNFOLLOWED_USER_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register a follower and three targets ==="
curl -s -c "$FOLLOWER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Follower\",\"email\":\"follower_$TS@example.com\",\"username\":\"follower$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$PUBLIC_USER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Public User\",\"email\":\"publicuser_$TS@example.com\",\"username\":\"publicuser$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$PRIVATE_USER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Private User\",\"email\":\"privateuser_$TS@example.com\",\"username\":\"privateuser$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$UNFOLLOWED_USER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Unfollowed User\",\"email\":\"unfolloweduser_$TS@example.com\",\"username\":\"unfolloweduser$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered all four."
echo -e "\n"

echo "=== 1. Public User and Unfollowed User opt in to public profiles; Private User does not ==="
curl -s -b "$PUBLIC_USER_JAR" -X PATCH "$BASE_URL/api/profile" -H "Content-Type: application/json" -d '{"isPublicProfile":true}' > /dev/null
curl -s -b "$UNFOLLOWED_USER_JAR" -X PATCH "$BASE_URL/api/profile" -H "Content-Type: application/json" -d '{"isPublicProfile":true}' > /dev/null
echo "Done."
echo -e "\n"

echo "=== 2. Public User and Unfollowed User each create a PUBLIC activity; Public User also creates a PRIVATE one ==="
curl -s -b "$PUBLIC_USER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Followable Public Hike","date":"2026-08-01","type":"hiking","visibility":"public"}' > /dev/null
curl -s -b "$PUBLIC_USER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Followable Private Hike","date":"2026-08-02","type":"hiking"}' > /dev/null
curl -s -b "$UNFOLLOWED_USER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Unfollowed User Public Hike","date":"2026-08-03","type":"hiking","visibility":"public"}' > /dev/null
echo "Done."
echo -e "\n"

echo "=== 3. Follower tries to follow the PRIVATE-profile user — expect 404 ==="
curl -s -w " [HTTP %{http_code}]" -b "$FOLLOWER_JAR" -X POST "$BASE_URL/api/community/users/privateuser$TS/follow"
echo -e "\n"

echo "=== 4. Public User tries to follow themself — expect 422 ==="
curl -s -w " [HTTP %{http_code}]" -b "$PUBLIC_USER_JAR" -X POST "$BASE_URL/api/community/users/publicuser$TS/follow"
echo -e "\n"

echo "=== 5. Follower follows Public User — expect 200, isFollowing: true ==="
curl -s -w " [HTTP %{http_code}]" -b "$FOLLOWER_JAR" -X POST "$BASE_URL/api/community/users/publicuser$TS/follow"
echo -e "\n"

echo "=== 6. Follower follows Public User AGAIN — expect 200, idempotent (not an error) ==="
curl -s -w " [HTTP %{http_code}]" -b "$FOLLOWER_JAR" -X POST "$BASE_URL/api/community/users/publicuser$TS/follow"
echo -e "\n"

echo "=== 7. Public User's profile, viewed by Follower — expect isFollowing: true ==="
curl -s -b "$FOLLOWER_JAR" "$BASE_URL/api/community/users/publicuser$TS" | grep -q '"isFollowing":true' && echo "OK: isFollowing true" || echo "!!! isFollowing not true !!!"
echo -e "\n"

echo "=== 8. Anonymous request for the Following feed — expect 401 ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/feed?scope=following"
echo -e "\n"

echo "=== 9. Follower's Following feed — expect ONLY Public User's public activity ==="
FEED=$(curl -s -b "$FOLLOWER_JAR" "$BASE_URL/api/community/feed?scope=following")
echo "$FEED" | grep -q "Followable Public Hike" && echo "OK: followed user's public activity present" || echo "!!! missing followed user's public activity !!!"
echo "$FEED" | grep -q "Followable Private Hike" && echo "!!! followed user's PRIVATE activity leaked !!!" || echo "OK: followed user's private activity absent"
echo "$FEED" | grep -q "Unfollowed User Public Hike" && echo "!!! an unfollowed user's activity leaked into the following feed !!!" || echo "OK: unfollowed user's activity absent"
echo -e "\n"

echo "=== 10. Follower unfollows Public User — expect 200, isFollowing: false ==="
curl -s -w " [HTTP %{http_code}]" -b "$FOLLOWER_JAR" -X DELETE "$BASE_URL/api/community/users/publicuser$TS/follow"
echo -e "\n"

echo "=== 11. Follower unfollows Public User AGAIN — expect 200, idempotent no-op ==="
curl -s -w " [HTTP %{http_code}]" -b "$FOLLOWER_JAR" -X DELETE "$BASE_URL/api/community/users/publicuser$TS/follow"
echo -e "\n"

echo "=== 12. Following feed after unfollowing — expect Public User's activity gone ==="
curl -s -b "$FOLLOWER_JAR" "$BASE_URL/api/community/feed?scope=following" | grep -q "Followable Public Hike" && echo "!!! still present after unfollow !!!" || echo "OK: gone after unfollow"
echo -e "\n"

rm -f "$FOLLOWER_JAR" "$PUBLIC_USER_JAR" "$PRIVATE_USER_JAR" "$UNFOLLOWED_USER_JAR"
echo "=== Done. Step 3 -> 404. Step 4 -> 422. Steps 5,6,10,11 -> 200. Step 8 -> 401. Steps 7,9,12 -> content checks above. ==="
