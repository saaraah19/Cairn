#!/usr/bin/env bash
# Manual verification script for Phase 9 — Profile & Settings.
# Run with the server running and a real MongoDB connection configured.
#
# Usage: bash scripts/test-profile-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="profile_test_$(date +%s)@example.com"
USERNAME="profiletester$(date +%s | tail -c 6)"
NEW_USERNAME="renamed$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Profile Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Update profile (name, bio, location) ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","bio":"Loves the mountains","location":"Oran"}'
echo -e "\n"

echo "=== 3. Change username — should succeed ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/profile" \
  -H "Content-Type: application/json" -d "{\"username\":\"$NEW_USERNAME\"}"
echo -e "\n"

echo "=== 4. Register a SECOND user and claim the OLD (now-freed) username — should succeed immediately ==="
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Second User\",\"email\":\"second_$(date +%s)@example.com\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n(confirms immediate release, per your decision — no grace period)\n"

echo "=== 5. Try to change password WITHOUT current password (should fail — account has one set) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/profile/password" \
  -H "Content-Type: application/json" -d '{"newPassword":"newpassword123"}'
echo -e "\n"

echo "=== 6. Change password WITH correct current password — should succeed ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/profile/password" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"correcthorsebattery","newPassword":"newpassword123"}'
echo -e "\n"

echo "=== 7. Log out, then log in with the NEW password — should succeed ==="
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/logout" > /dev/null
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"newpassword123\"}"
echo -e "\n"

echo "=== 8. Update privacy preference (defaultActivityVisibility) ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/profile" \
  -H "Content-Type: application/json" -d '{"preferences":{"defaultActivityVisibility":"public"}}'
echo -e "\n(confirm this did NOT reset preferences.theme — check the full preferences object)\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 4 confirms immediate username release, step 5 requires current"
echo "password, step 6-7 confirm the new password actually works for login, and step 8's preferences"
echo "object still has BOTH theme and defaultActivityVisibility (partial preference updates shouldn't"
echo "wipe the other preference field). ==="
