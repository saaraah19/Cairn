#!/usr/bin/env bash
# M6 — Comments. Covers docs/08_COMMUNITY_PROPOSAL.md §13 M6:
#   - comment write/read blocked on private activities
#   - only author or activity owner can delete
#   - only author can edit
#   - deletion by an unrelated user is rejected
#
# Usage: bash scripts/test-community-comments.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
OWNER_JAR=$(mktemp)
COMMENTER_JAR=$(mktemp)
STRANGER_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register owner, commenter, and an unrelated stranger ==="
curl -s -c "$OWNER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Comment Owner\",\"email\":\"commentowner_$TS@example.com\",\"username\":\"commentowner$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$COMMENTER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Commenter\",\"email\":\"commenter_$TS@example.com\",\"username\":\"commenter$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$STRANGER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Stranger\",\"email\":\"stranger_$TS@example.com\",\"username\":\"stranger$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered all three."
echo -e "\n"

echo "=== 1. Owner creates a PUBLIC and a PRIVATE activity ==="
PUBLIC_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Comment Test Hike","date":"2026-08-01","type":"hiking","visibility":"public"}' | grep -oP '"_id":"\K[^"]+' | head -1)
PRIVATE_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Comment Private Hike","date":"2026-08-02","type":"hiking"}' | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Public: $PUBLIC_ID, Private: $PRIVATE_ID"
echo -e "\n"

echo "=== 2. Comment on the PRIVATE activity — expect 404 (write) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COMMENTER_JAR" -X POST "$BASE_URL/api/community/activities/$PRIVATE_ID/comments" \
  -H "Content-Type: application/json" -d '{"text":"Should never be created"}'
echo -e "\n"

echo "=== 3. Read comments on the PRIVATE activity — expect 404 (read) ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/activities/$PRIVATE_ID/comments"
echo -e "\n"

echo "=== 4. Comment on the PUBLIC activity — expect 201 ==="
COMMENT_RESPONSE=$(curl -s -w " [HTTP %{http_code}]" -b "$COMMENTER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/comments" \
  -H "Content-Type: application/json" -d '{"text":"Beautiful trail!"}')
echo "$COMMENT_RESPONSE"
COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -oP '"id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 5. Read comments anonymously — expect 200, comment visible ==="
curl -s "$BASE_URL/api/community/activities/$PUBLIC_ID/comments" | grep -q "Beautiful trail" && echo "OK: comment visible" || echo "!!! comment not visible !!!"
echo -e "\n"

echo "=== 6. Stranger tries to edit the comment — expect 403 ==="
curl -s -w " [HTTP %{http_code}]" -b "$STRANGER_JAR" -X PATCH "$BASE_URL/api/community/comments/$COMMENT_ID" \
  -H "Content-Type: application/json" -d '{"text":"Hijacked"}'
echo -e "\n"

echo "=== 7. Activity owner tries to edit the comment (not the author) — expect 403 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X PATCH "$BASE_URL/api/community/comments/$COMMENT_ID" \
  -H "Content-Type: application/json" -d '{"text":"Owner trying to edit"}'
echo -e "\n"

echo "=== 8. Author edits their own comment — expect 200 ==="
curl -s -w " [HTTP %{http_code}]" -b "$COMMENTER_JAR" -X PATCH "$BASE_URL/api/community/comments/$COMMENT_ID" \
  -H "Content-Type: application/json" -d '{"text":"Beautiful trail, edited!"}'
echo -e "\n"

echo "=== 9. Stranger tries to delete the comment — expect 403 ==="
curl -s -w " [HTTP %{http_code}]" -b "$STRANGER_JAR" -X DELETE "$BASE_URL/api/community/comments/$COMMENT_ID"
echo -e "\n"

echo "=== 10. Activity owner deletes the comment (their right, even though not the author) — expect 200 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X DELETE "$BASE_URL/api/community/comments/$COMMENT_ID"
echo -e "\n"

echo "=== 11. Confirm it's gone ==="
curl -s "$BASE_URL/api/community/activities/$PUBLIC_ID/comments" | grep -q "Beautiful trail" && echo "!!! still present !!!" || echo "OK: comment gone"
echo -e "\n"

rm -f "$OWNER_JAR" "$COMMENTER_JAR" "$STRANGER_JAR"
echo "=== Done. Steps 2,3 -> 404. Step 4 -> 201. Step 5 -> visible. Steps 6,7,9 -> 403. Step 8,10 -> 200. Step 11 -> gone. ==="
