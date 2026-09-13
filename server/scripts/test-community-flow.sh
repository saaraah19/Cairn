#!/usr/bin/env bash
# M11 — Cross-Feature Security Audit (named "M10" in docs/08_COMMUNITY_
# PROPOSAL.md §13; renumbered because M10 in this project's actual
# sequence was already used for the mid-stream Comment Likes & Replies
# addition — see docs/PROGRESS.md).
#
# Unlike every other test-community-*.sh script, this one is NOT about a
# single feature — it exercises §10's consolidated threat table with
# features working TOGETHER, the way M2-M10's own tests individually
# could not:
#
#   - A full comment -> report -> activity-deletion sequence, confirming
#     the cascade (comment + its replies gone) and that nothing downstream
#     (the report record, notifications) crashes on the now-dangling
#     references — exercising M2/M6/M7/M9's "render safely, never error"
#     guarantees TOGETHER, not each in isolation.
#   - Following genuinely grants zero extra read access: a followed
#     user's PRIVATE activity must never appear anywhere reachable via
#     the follow relationship, even though the follow itself succeeded.
#   - Rate limiting (§14) actually fires — the one dependency this
#     milestone exists specifically to confirm before sign-off, and which
#     did not exist anywhere in the codebase before this milestone.
#
# It does NOT re-implement every single-feature test M2-M10 already cover
# (self-kudos, duplicate follow, etc.) — see those scripts for that.
#
# Usage: bash scripts/test-community-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
OWNER_JAR=$(mktemp)
COMMENTER_JAR=$(mktemp)
REPORTER_JAR=$(mktemp)
BYSTANDER_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register owner, commenter, reporter, bystander ==="
curl -s -c "$OWNER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Audit Owner\",\"email\":\"auditowner_$TS@example.com\",\"username\":\"auditowner$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$COMMENTER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Audit Commenter\",\"email\":\"auditcommenter_$TS@example.com\",\"username\":\"auditcommenter$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$REPORTER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Audit Reporter\",\"email\":\"auditreporter_$TS@example.com\",\"username\":\"auditreporter$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$BYSTANDER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Audit Bystander\",\"email\":\"auditbystander_$TS@example.com\",\"username\":\"auditbystander$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -b "$OWNER_JAR" -X PATCH "$BASE_URL/api/profile" -H "Content-Type: application/json" -d '{"isPublicProfile":true}' > /dev/null
echo "Registered all four; Owner's profile is public."
echo -e "\n"

echo "############################################"
echo "# PART 1 — Comment -> Report -> Delete cascade"
echo "############################################"

echo "=== 1. Owner creates a public activity with sensitive private-adjacent fields ==="
ACTIVITY_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Audit Trail Hike","date":"2026-08-01","type":"hiking","visibility":"public","costDzd":5000,"social":{"companions":["Amel","Yasmine"]}}' \
  | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Activity: $ACTIVITY_ID"

echo "=== 2. Companions/cost never leak through the public read — expect NO match for either ==="
PUBLIC_VIEW=$(curl -s "$BASE_URL/api/community/activities/$ACTIVITY_ID")
echo "$PUBLIC_VIEW" | grep -q "Amel" && echo "!!! companion name leaked !!!" || echo "OK: companions absent"
echo "$PUBLIC_VIEW" | grep -q "costDzd" && echo "!!! costDzd leaked !!!" || echo "OK: costDzd absent"
echo -e "\n"

echo "=== 3. Commenter comments on it, Owner replies ==="
COMMENT_ID=$(curl -s -b "$COMMENTER_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" \
  -H "Content-Type: application/json" -d '{"text":"Love this trail!"}' | grep -oP '"id":"\K[^"]+' | head -1)
curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" \
  -H "Content-Type: application/json" -d "{\"text\":\"Thanks!\",\"parentCommentId\":\"$COMMENT_ID\"}" > /dev/null
echo "Comment: $COMMENT_ID (with one reply)"
echo -e "\n"

echo "=== 4. Bystander (neither author nor activity owner) tries to delete the comment — expect 403 ==="
curl -s -w " [HTTP %{http_code}]" -b "$BYSTANDER_JAR" -X DELETE "$BASE_URL/api/community/comments/$COMMENT_ID"
echo -e "\n"

echo "=== 5. Reporter reports the comment ==="
curl -s -w " [HTTP %{http_code}]" -b "$REPORTER_JAR" -X POST "$BASE_URL/api/community/comments/$COMMENT_ID/reports" \
  -H "Content-Type: application/json" -d '{"reason":"spam"}'
echo -e "\n"

echo "=== 6. Owner deletes the ENTIRE ACTIVITY (comment, reply, and report's target all become dangling) ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X DELETE "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

echo "=== 7. The activity, its comments, and the reply are all genuinely gone (404 / empty), not crashing ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/activities/$ACTIVITY_ID"
echo -e "\n"
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments"
echo -e "\n"

echo "=== 8. Commenter's and Owner's notification inboxes still load without error despite the dangling references ==="
curl -s -w " [HTTP %{http_code}]" -b "$COMMENTER_JAR" "$BASE_URL/api/notifications" > /dev/null
echo " (Commenter inbox loaded)"
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" "$BASE_URL/api/notifications" > /dev/null
echo " (Owner inbox loaded)"
echo -e "\n"

echo "############################################"
echo "# PART 2 — Following grants ZERO extra read access"
echo "############################################"

echo "=== 9. Owner creates one PUBLIC and one PRIVATE activity ==="
NEW_PUBLIC_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Follow Audit Public","date":"2026-08-02","type":"hiking","visibility":"public"}' | grep -oP '"_id":"\K[^"]+' | head -1)
curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Follow Audit Private Secret","date":"2026-08-03","type":"hiking"}' > /dev/null
echo -e "\n"

echo "=== 10. Bystander follows Owner ==="
curl -s -w " [HTTP %{http_code}]" -b "$BYSTANDER_JAR" -X POST "$BASE_URL/api/community/users/auditowner$TS/follow"
echo -e "\n"

echo "=== 11. Bystander's Following feed shows the PUBLIC one, never the PRIVATE one — even though they now follow Owner ==="
FEED=$(curl -s -b "$BYSTANDER_JAR" "$BASE_URL/api/community/feed?scope=following")
echo "$FEED" | grep -q "Follow Audit Public" && echo "OK: public activity visible via follow" || echo "!!! public activity missing from following feed !!!"
echo "$FEED" | grep -q "Secret" && echo "!!! PRIVATE activity leaked via the follow relationship !!!" || echo "OK: private activity never leaked via follow"
echo -e "\n"

echo "=== 12. Bystander still cannot fetch the private activity directly by id either — expect 404 ==="
DIRECT_FETCH=$(curl -s "$BASE_URL/api/community/activities/$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" -d '{"name":"Throwaway Private","date":"2026-08-04","type":"hiking"}' | grep -oP '"_id":"\K[^"]+' | head -1)" -w " [HTTP %{http_code}]")
echo "$DIRECT_FETCH"
echo -e "\n"

echo "############################################"
echo "# PART 3 — Rate limiting actually fires (§14)"
echo "############################################"

echo "=== 13. Hammering /api/auth/login with wrong credentials — expect a 429 to appear within ~15 attempts ==="
GOT_429=0
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"auditowner_$TS@example.com\",\"password\":\"wrongpassword\"}")
  if [ "$CODE" = "429" ]; then
    GOT_429=1
    echo "Got 429 on attempt $i"
    break
  fi
done
[ "$GOT_429" = "1" ] && echo "OK: auth rate limiting is active" || echo "!!! no 429 seen after 15 attempts — rate limiting may not be active !!!"
echo -e "\n"

echo "=== 14. Hammering a community write endpoint (kudos) as an authenticated user — expect a 429 within ~65 attempts ==="
GOT_429=0
for i in $(seq 1 65); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$BYSTANDER_JAR" -X POST "$BASE_URL/api/community/activities/$NEW_PUBLIC_ID/kudos")
  if [ "$CODE" = "429" ]; then
    GOT_429=1
    echo "Got 429 on attempt $i"
    break
  fi
  # First successful kudos toggles it on; remove it so the loop can keep
  # calling the same endpoint without hitting an unrelated idempotent-200
  # branch masking whether the limiter itself is what's firing.
  if [ "$i" = "1" ]; then
    curl -s -o /dev/null -b "$BYSTANDER_JAR" -X DELETE "$BASE_URL/api/community/activities/$NEW_PUBLIC_ID/kudos"
  fi
done
[ "$GOT_429" = "1" ] && echo "OK: community write rate limiting is active" || echo "!!! no 429 seen after 65 attempts — rate limiting may not be active !!!"
echo -e "\n"

rm -f "$OWNER_JAR" "$COMMENTER_JAR" "$REPORTER_JAR" "$BYSTANDER_JAR"
echo "=== Done. See inline OK/!!! markers above for pass/fail on each threat-table row exercised. ==="
