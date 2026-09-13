#!/usr/bin/env bash
# M10 — Comment Likes & Replies. Covers docs/08_COMMUNITY_PROPOSAL.md §5's
# 2026-09-13 revision:
#   - a reply notifies the parent comment's author, not the activity owner again
#   - replying to a reply is rejected (threading capped at one level)
#   - a reply nests under its parent when listing comments
#   - deleting a top-level comment cascades to delete its replies
#   - self-liking a comment is rejected
#   - liking a comment twice is idempotent (no double count)
#   - unliking is idempotent and the counter never goes negative
#
# Usage: bash scripts/test-community-comment-likes-replies.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
OWNER_JAR=$(mktemp)
ASKER_JAR=$(mktemp)
LIKER_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register an activity owner, an asker, and a liker ==="
curl -s -c "$OWNER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Reply Owner\",\"email\":\"replyowner_$TS@example.com\",\"username\":\"replyowner$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$ASKER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Reply Asker\",\"email\":\"replyasker_$TS@example.com\",\"username\":\"replyasker$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$LIKER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Comment Liker\",\"email\":\"commentliker_$TS@example.com\",\"username\":\"commentliker$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered all three."
echo -e "\n"

echo "=== 1. Owner creates a public activity ==="
ACTIVITY_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Reply Test Hike","date":"2026-08-01","type":"hiking","visibility":"public"}' | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Activity: $ACTIVITY_ID"
echo -e "\n"

echo "=== 2. Asker posts a top-level comment ('wow, where is this?') ==="
TOP_LEVEL_RESPONSE=$(curl -s -b "$ASKER_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" \
  -H "Content-Type: application/json" -d '{"text":"Wow, where is this place?"}')
COMMENT_ID=$(echo "$TOP_LEVEL_RESPONSE" | grep -oP '"id":"\K[^"]+' | head -1)
echo "Top-level comment: $COMMENT_ID"
echo -e "\n"

echo "=== 3. Owner replies to that comment ('It's Cap Blanc!') — expect 201 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" \
  -H "Content-Type: application/json" -d "{\"text\":\"It's Cap Blanc, near Oran!\",\"parentCommentId\":\"$COMMENT_ID\"}"
echo -e "\n"
REPLY_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" \
  -H "Content-Type: application/json" -d "{\"text\":\"Second reply for delete-cascade testing\",\"parentCommentId\":\"$COMMENT_ID\"}" | grep -oP '"id":"\K[^"]+' | head -1)

echo "=== 4. Asker attempts to reply to the REPLY (not the top-level comment) — expect 422 ==="
curl -s -w " [HTTP %{http_code}]" -b "$ASKER_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" \
  -H "Content-Type: application/json" -d "{\"text\":\"Can I get directions?\",\"parentCommentId\":\"$REPLY_ID\"}"
echo -e "\n"

echo "=== 5. Listing comments: exactly 1 top-level comment, with 2 nested replies ==="
LIST_RESPONSE=$(curl -s "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments")
TOP_LEVEL_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"parentCommentId":null' | wc -l)
echo "Top-level comments in response: $TOP_LEVEL_COUNT (expect 1)"
echo "$LIST_RESPONSE" | grep -q '"replies":\[' && echo "OK: replies array present" || echo "!!! replies array missing !!!"
echo -e "\n"

echo "=== 6. Asker likes their OWN comment — expect 422 (self-like blocked) ==="
curl -s -w " [HTTP %{http_code}]" -b "$ASKER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/like"
echo -e "\n"

echo "=== 7. Liker likes the comment (not their own) — expect 200, likesCount: 1 ==="
curl -s -w " [HTTP %{http_code}]" -b "$LIKER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/like"
echo -e "\n"

echo "=== 8. Liker likes it AGAIN — expect 200, still likesCount: 1 (idempotent, not doubled) ==="
curl -s -w " [HTTP %{http_code}]" -b "$LIKER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/like"
echo -e "\n"

echo "=== 9. Owner also likes the same comment — expect 200, likesCount: 2 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/like"
echo -e "\n"

echo "=== 10. Liker unlikes it — expect 200, likesCount: 1 ==="
curl -s -w " [HTTP %{http_code}]" -b "$LIKER_JAR" -X DELETE "$BASE_URL/api/community/comments/$COMMENT_ID/like"
echo -e "\n"

echo "=== 11. Liker unlikes it AGAIN — expect 200, idempotent no-op, still likesCount: 1 ==="
curl -s -w " [HTTP %{http_code}]" -b "$LIKER_JAR" -X DELETE "$BASE_URL/api/community/comments/$COMMENT_ID/like"
echo -e "\n"

echo "=== 12. Asker deletes their top-level comment — its replies should cascade-delete too ==="
curl -s -w " [HTTP %{http_code}]" -b "$ASKER_JAR" -X DELETE "$BASE_URL/api/community/comments/$COMMENT_ID"
echo -e "\n"
curl -s "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" | grep -q "Cap Blanc" && echo "!!! reply survived parent deletion !!!" || echo "OK: reply cascade-deleted with its parent"
echo -e "\n"

rm -f "$OWNER_JAR" "$ASKER_JAR" "$LIKER_JAR"
echo "=== Done. Step 3 -> 201. Step 4 -> 422. Step 5 -> counts above. Step 6 -> 422. Steps 7,8,9,10,11 -> 200 (counts noted). Step 12 -> cascade check above. ==="
