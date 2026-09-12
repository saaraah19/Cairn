#!/usr/bin/env bash
# M9 — Notifications Inbox. Covers docs/08_COMMUNITY_PROPOSAL.md §8/§13 M9:
#   - a user can only ever read their own notifications
#   - notifications are actually created by kudos/comment/follow events
#   - mark-read and mark-all-read work and are idempotent
#   - unread count reflects reality
#
# Usage: bash scripts/test-community-notifications.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
OWNER_JAR=$(mktemp)
ACTOR_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register an activity owner and an actor who will interact with it ==="
curl -s -c "$OWNER_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Notif Owner\",\"email\":\"notifowner_$TS@example.com\",\"username\":\"notifowner$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -c "$ACTOR_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Notif Actor\",\"email\":\"notifactor_$TS@example.com\",\"username\":\"notifactor$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
curl -s -b "$OWNER_JAR" -X PATCH "$BASE_URL/api/profile" -H "Content-Type: application/json" -d '{"isPublicProfile":true}' > /dev/null
echo "Done."
echo -e "\n"

echo "=== 1. Owner has zero unread notifications before anything happens ==="
curl -s -b "$OWNER_JAR" "$BASE_URL/api/notifications/unread-count"
echo -e "\n"

echo "=== 2. Owner creates a public activity; Actor gives kudos and comments on it ==="
ACTIVITY_ID=$(curl -s -b "$OWNER_JAR" -X POST "$BASE_URL/api/activities" -H "Content-Type: application/json" \
  -d '{"name":"Notification Test Hike","date":"2026-08-01","type":"hiking","visibility":"public"}' | grep -oP '"_id":"\K[^"]+' | head -1)
curl -s -b "$ACTOR_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/kudos" > /dev/null
curl -s -b "$ACTOR_JAR" -X POST "$BASE_URL/api/community/activities/$ACTIVITY_ID/comments" -H "Content-Type: application/json" \
  -d '{"text":"Awesome hike!"}' > /dev/null
curl -s -b "$ACTOR_JAR" -X POST "$BASE_URL/api/community/users/notifowner$TS/follow" > /dev/null
echo "Kudos, comment, and follow all done against $ACTIVITY_ID."
echo -e "\n"

echo "=== 3. Owner now has 3 unread notifications (kudos, comment, follow) ==="
curl -s -b "$OWNER_JAR" "$BASE_URL/api/notifications/unread-count"
echo -e "\n"

echo "=== 4. Owner's inbox lists all three, each resolving the Actor's name correctly ==="
INBOX=$(curl -s -b "$OWNER_JAR" "$BASE_URL/api/notifications")
echo "$INBOX" | grep -o '"type":"[a-z]*"' | sort | uniq -c
echo "$INBOX" | grep -q "Notif Actor" && echo "OK: actor name resolved" || echo "!!! actor name missing !!!"
FIRST_NOTIF_ID=$(echo "$INBOX" | grep -oP '"id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 5. Actor (not the recipient) tries to mark Owner's notification as read — expect 404 ==="
curl -s -w " [HTTP %{http_code}]" -b "$ACTOR_JAR" -X PATCH "$BASE_URL/api/notifications/$FIRST_NOTIF_ID/read"
echo -e "\n"

echo "=== 6. Owner marks that one notification as read — expect 200, isRead: true ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X PATCH "$BASE_URL/api/notifications/$FIRST_NOTIF_ID/read"
echo -e "\n"

echo "=== 7. Marking the same notification read again — expect 200, idempotent ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X PATCH "$BASE_URL/api/notifications/$FIRST_NOTIF_ID/read"
echo -e "\n"

echo "=== 8. Unread count dropped by exactly one ==="
curl -s -b "$OWNER_JAR" "$BASE_URL/api/notifications/unread-count"
echo -e "\n"

echo "=== 9. Owner marks ALL notifications as read ==="
curl -s -w " [HTTP %{http_code}]" -b "$OWNER_JAR" -X PATCH "$BASE_URL/api/notifications/read-all"
echo -e "\n"

echo "=== 10. Unread count is now 0 ==="
curl -s -b "$OWNER_JAR" "$BASE_URL/api/notifications/unread-count"
echo -e "\n"

echo "=== 11. Actor has zero notifications of their own (nobody interacted with THEIR content) ==="
curl -s -b "$ACTOR_JAR" "$BASE_URL/api/notifications/unread-count"
echo -e "\n"

echo "=== 12. Anonymous request for the inbox — expect 401 ==="
curl -s -w " [HTTP %{http_code}]" "$BASE_URL/api/notifications"
echo -e "\n"

rm -f "$OWNER_JAR" "$ACTOR_JAR"
echo "=== Done. Step 1 -> count:0. Step 3 -> count:3. Step 5 -> 404. Steps 6,7,9 -> 200. Step 8 -> count:2. Step 10 -> count:0. Step 11 -> count:0. Step 12 -> 401. ==="
