#!/usr/bin/env bash
# M7 — Reporting. Covers docs/08_COMMUNITY_PROPOSAL.md §7/§13 M7:
#   - reporting a private/nonexistent activity is rejected
#   - self-reporting (activity or comment) is rejected
#   - a genuine report of another user's public activity succeeds
#   - a duplicate report from the same user on the same target is
#     rejected (NOT idempotent, unlike Kudos)
#   - a different reporter on the same target succeeds independently
#   - reporting a comment resolves ownership to the comment's author, so
#     the activity owner can validly report a comment on their own activity
#
# Usage: bash scripts/test-community-reporting.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
OWNER_JAR=$(mktemp)
COMMENTER_JAR=$(mktemp)
REPORTER_JAR=$(mktemp)
REPORTER2_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register owner, commenter, and two reporters ==="
curl -s -c "$OWNER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Report Owner\",\"email\":\"reportowner_$TS@example.com\",\"username\":\"reportowner$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$COMMENTER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Report Commenter\",\"email\":\"reportcommenter_$TS@example.com\",\"username\":\"reportcommenter$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$REPORTER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Reporter One\",\"email\":\"reporter1_$TS@example.com\",\"username\":\"reporter1$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$REPORTER2_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Reporter Two\",\"email\":\"reporter2_$TS@example.com\",\"username\":\"reporter2$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered all four."
echo -e "\n"

echo "=== 1. Owner creates a PUBLIC and a PRIVATE activity ==="
PUBLIC_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Report Test Hike","date":"2026-08-01","type":"hiking","visibility":"public"}' | grep -oP '"_id":"\K[^"]+' | head -1)
PRIVATE_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Report Private Hike","date":"2026-08-02","type":"hiking"}' | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Public: $PUBLIC_ID, Private: $PRIVATE_ID"
echo -e "\n"

echo "=== 2. Commenter posts a comment on the PUBLIC activity ==="
COMMENT_RESPONSE=$(curl -s -b "$COMMENTER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/comments" \
  -H "Content-Type: application/json" -d '{"text":"Great trail!"}')
COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -oP '"id":"\K[^"]+' | head -1)
echo "Comment: $COMMENT_ID"
echo -e "\n"

echo "=== 3. Report the PRIVATE activity — expect 404 ==="
curl -s -w " [HTTP %{http_code}]" -b "$REPORTER_JAR" -X POST "$BASE_URL/api/community/activities/$PRIVATE_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"spam"}'
echo -e "\n"

echo "=== 4. Owner self-reports their own PUBLIC activity — expect 422 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"spam"}'
echo -e "\n"

echo "=== 5. Reporter One reports the PUBLIC activity — expect 201 ==="
curl -s -w " [HTTP %{http_code}]" -b "$REPORTER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"inappropriate_content","details":"Looks like spam content."}'
echo -e "\n"

echo "=== 6. Reporter One reports the SAME activity again — expect 409 (not idempotent) ==="
curl -s -w " [HTTP %{http_code}]" -b "$REPORTER_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"harassment"}'
echo -e "\n"

echo "=== 7. Reporter Two reports the SAME activity — expect 201 (independent of Reporter One) ==="
curl -s -w " [HTTP %{http_code}]" -b "$REPORTER2_JAR" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"other"}'
echo -e "\n"

echo "=== 8. Commenter self-reports their own comment — expect 422 ==="
curl -s -w " [HTTP %{http_code}]" -b "$COMMENTER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"spam"}'
echo -e "\n"

echo "=== 9. Activity owner reports the commenter's comment on their own activity — expect 201 ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"harassment"}'
echo -e "\n"

echo "=== 10. Anonymous (no cookie jar) attempts to report — expect 401 ==="
curl -s -w " [HTTP %{http_code}]" -X POST "$BASE_URL/api/community/activities/$PUBLIC_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"spam"}'
echo -e "\n"

rm -f "$OWNER_JAR" "$COMMENTER_JAR" "$REPORTER_JAR" "$REPORTER2_JAR"
echo "=== Done. Step 3 -> 404. Steps 4,8 -> 422. Steps 5,7,9 -> 201. Step 6 -> 409. Step 10 -> 401. ==="
