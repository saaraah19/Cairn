#!/usr/bin/env bash
# Manual verification script for Phase 10 — Data Management (export + account
# deletion). Run with the server running and a real MongoDB connection
# configured.
#
# WARNING: this script deletes the test account it creates. It only touches
# a freshly-registered throwaway user, never your real account.
#
# Usage: bash scripts/test-data-management-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="delete_test_$(date +%s)@example.com"
USERNAME="deletetester$(date +%s | tail -c 6)"

echo "=== 1. Register a throwaway test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Delete Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create one of each resource type ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" -d '{"name":"Test Hike","date":"2026-09-01"}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" \
  -H "Content-Type: application/json" -d '{"name":"Test Boots","category":"footwear"}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/planned-activities" \
  -H "Content-Type: application/json" -d '{"name":"Test Plan","plannedDate":"2026-10-01"}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/destinations" \
  -H "Content-Type: application/json" -d '{"name":"Test Destination"}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/groups" \
  -H "Content-Type: application/json" -d '{"name":"Test Group"}' > /dev/null
echo "Created: 1 activity, 1 gear item, 1 planned activity, 1 destination, 1 group."
echo -e "\n"

echo "=== 3. Export data — should include all 5 resource types plus profile ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/profile/export" | head -c 2000
echo -e "\n...(truncated — check full response has activities/gear/plannedActivities/destinations/groups arrays, each with 1 item)\n"

echo "=== 4. Attempt account deletion WITHOUT current password (should fail — account has one) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/profile/account" \
  -H "Content-Type: application/json" -d '{"confirmation":"DELETE"}'
echo -e "\n"

echo "=== 5. Attempt account deletion with WRONG password (should fail) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/profile/account" \
  -H "Content-Type: application/json" \
  -d '{"confirmation":"DELETE","currentPassword":"wrongpassword"}'
echo -e "\n"

echo "=== 6. Delete the account for real (correct confirmation + password) ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/profile/account" \
  -H "Content-Type: application/json" \
  -d '{"confirmation":"DELETE","currentPassword":"correcthorsebattery"}'
echo -e "\n"

echo "=== 7. Confirm the session is dead — /me should now be rejected ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" "$BASE_URL/api/auth/me"
echo -e "\n"

echo "=== 8. Confirm login with the deleted account's credentials now fails ==="
curl -s -w " [HTTP %{http_code}]" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 3 export includes all resource types, step 4-5 rejections,"
echo "step 7-8 confirm the account is truly gone. Also manually check your MongoDB directly (or"
echo "Cloudinary dashboard, if this test user had any photos) to confirm no orphaned data remains"
echo "for this user ID — the script can't check that part for you. ==="
